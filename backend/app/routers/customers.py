"""
KadaiGPT - Customers Router
Manage customer credit book (Khata) and customer relationships
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.models import User, Store
from app.routers.auth import get_current_user

router = APIRouter(prefix="/customers", tags=["Customers"])


# ==================== SCHEMAS ====================

class CustomerCreate(BaseModel):
    """Schema for creating a customer"""
    name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None


class CustomerUpdate(BaseModel):
    """Schema for updating a customer"""
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None


class CustomerPayment(BaseModel):
    """Schema for recording a payment"""
    amount: float


class CustomerCredit(BaseModel):
    """Schema for adding credit"""
    amount: float
    notes: Optional[str] = None


class CustomerResponse(BaseModel):
    """Response schema for customer"""
    id: int
    name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    credit: float
    total_purchases: float
    last_purchase: Optional[str] = None
    is_paid: bool
    created_at: str

    class Config:
        from_attributes = True


# In-memory storage (will be replaced with database model)
# For now, store per-user customers
_customer_storage = {}


def get_user_customers(user_id: int) -> list:
    """Get customers for a specific user"""
    if user_id not in _customer_storage:
        _customer_storage[user_id] = []
    return _customer_storage[user_id]


def save_user_customers(user_id: int, customers: list):
    """Save customers for a specific user"""
    _customer_storage[user_id] = customers


# ==================== ROUTES ====================

@router.get("/stats/summary", response_model=dict)
async def get_customer_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get customer statistics
    """
    customers = get_user_customers(current_user.id)
    
    total_customers = len(customers)
    total_credit = sum(c['credit'] for c in customers)
    customers_with_credit = sum(1 for c in customers if c['credit'] > 0)
    total_business = sum(c['total_purchases'] for c in customers)
    
    return {
        "total_customers": total_customers,
        "total_credit": total_credit,
        "customers_with_credit": customers_with_credit,
        "total_business": total_business
    }


@router.get("", response_model=List[dict])
async def get_customers(
    search: Optional[str] = Query(None, description="Search by name or phone"),
    has_credit: Optional[bool] = Query(None, description="Filter by credit status"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all customers for the current user's store
    """
    customers = get_user_customers(current_user.id)
    
    # Apply filters
    if search:
        search_lower = search.lower()
        customers = [c for c in customers if search_lower in c['name'].lower() or search in c['phone']]
    
    if has_credit is not None:
        if has_credit:
            customers = [c for c in customers if c['credit'] > 0]
        else:
            customers = [c for c in customers if c['credit'] == 0]
    
    return customers


@router.post("", response_model=dict)
async def create_customer(
    customer: CustomerCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new customer
    """
    customers = get_user_customers(current_user.id)
    
    # Check if phone already exists
    if any(c['phone'] == customer.phone for c in customers):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Customer with this phone already exists"
        )
    
    new_customer = {
        "id": len(customers) + 1 if customers else 1,
        "name": customer.name,
        "phone": customer.phone,
        "email": customer.email,
        "address": customer.address,
        "credit": 0.0,
        "total_purchases": 0.0,
        "last_purchase": None,
        "is_paid": True,
        "created_at": datetime.utcnow().isoformat()
    }
    
    customers.insert(0, new_customer)
    save_user_customers(current_user.id, customers)
    
    return new_customer


@router.get("/{customer_id}", response_model=dict)
async def get_customer(
    customer_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific customer by ID
    """
    customers = get_user_customers(current_user.id)
    customer = next((c for c in customers if c['id'] == customer_id), None)
    
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    return customer


@router.put("/{customer_id}", response_model=dict)
async def update_customer(
    customer_id: int,
    customer_update: CustomerUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a customer
    """
    customers = get_user_customers(current_user.id)
    customer_index = next((i for i, c in enumerate(customers) if c['id'] == customer_id), None)
    
    if customer_index is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    # Update fields
    if customer_update.name is not None:
        customers[customer_index]['name'] = customer_update.name
    if customer_update.phone is not None:
        customers[customer_index]['phone'] = customer_update.phone
    if customer_update.email is not None:
        customers[customer_index]['email'] = customer_update.email
    if customer_update.address is not None:
        customers[customer_index]['address'] = customer_update.address
    
    save_user_customers(current_user.id, customers)
    
    return customers[customer_index]


@router.delete("/{customer_id}")
async def delete_customer(
    customer_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a customer
    """
    customers = get_user_customers(current_user.id)
    customer_index = next((i for i, c in enumerate(customers) if c['id'] == customer_id), None)
    
    if customer_index is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    deleted_customer = customers.pop(customer_index)
    save_user_customers(current_user.id, customers)
    
    return {"message": f"Customer '{deleted_customer['name']}' deleted successfully"}


@router.post("/{customer_id}/payment", response_model=dict)
async def record_payment(
    customer_id: int,
    payment: CustomerPayment,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Record a payment from customer
    """
    customers = get_user_customers(current_user.id)
    customer_index = next((i for i, c in enumerate(customers) if c['id'] == customer_id), None)
    
    if customer_index is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    if payment.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment amount must be positive"
        )
    
    customer = customers[customer_index]
    new_credit = max(0, customer['credit'] - payment.amount)
    customer['credit'] = new_credit
    customer['is_paid'] = new_credit == 0
    
    save_user_customers(current_user.id, customers)
    
    return {
        "message": f"Payment of ₹{payment.amount} recorded",
        "new_credit": new_credit,
        "customer": customer
    }


@router.post("/{customer_id}/credit", response_model=dict)
async def add_credit(
    customer_id: int,
    credit: CustomerCredit,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Add credit (udhar) for a customer
    """
    customers = get_user_customers(current_user.id)
    customer_index = next((i for i, c in enumerate(customers) if c['id'] == customer_id), None)
    
    if customer_index is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    if credit.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Credit amount must be positive"
        )
    
    customer = customers[customer_index]
    customer['credit'] += credit.amount
    customer['is_paid'] = False
    customer['total_purchases'] += credit.amount
    customer['last_purchase'] = datetime.utcnow().isoformat()
    
    save_user_customers(current_user.id, customers)
    
    return {
        "message": f"₹{credit.amount} added to credit",
        "new_credit": customer['credit'],
        "customer": customer
    }

