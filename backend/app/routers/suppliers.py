"""
KadaiGPT - Suppliers Router
Manage suppliers and purchase orders
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
import random

from app.database import get_db
from app.models import User, Store
from app.routers.auth import get_current_user

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])


# ==================== SCHEMAS ====================

class SupplierCreate(BaseModel):
    """Schema for creating a supplier"""
    name: str
    contact: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    category: str = "General"


class SupplierUpdate(BaseModel):
    """Schema for updating a supplier"""
    name: Optional[str] = None
    contact: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    category: Optional[str] = None


class PurchaseOrderItem(BaseModel):
    """Item in a purchase order"""
    product_name: str
    quantity: float
    unit: str
    unit_price: float


class PurchaseOrderCreate(BaseModel):
    """Schema for creating a purchase order"""
    supplier_id: int
    items: List[PurchaseOrderItem]
    notes: Optional[str] = None


class SupplierPayment(BaseModel):
    """Schema for recording payment to supplier"""
    amount: float
    notes: Optional[str] = None


# In-memory storage (will be replaced with database model)
_supplier_storage = {}
_order_storage = {}


def get_user_suppliers(user_id: int) -> list:
    """Get suppliers for a specific user"""
    if user_id not in _supplier_storage:
        _supplier_storage[user_id] = []
    return _supplier_storage[user_id]


def save_user_suppliers(user_id: int, suppliers: list):
    """Save suppliers for a specific user"""
    _supplier_storage[user_id] = suppliers


def get_user_orders(user_id: int) -> list:
    """Get purchase orders for a specific user"""
    if user_id not in _order_storage:
        _order_storage[user_id] = []
    return _order_storage[user_id]


def save_user_orders(user_id: int, orders: list):
    """Save purchase orders for a specific user"""
    _order_storage[user_id] = orders


# ==================== ROUTES ====================

@router.get("", response_model=List[dict])
async def get_suppliers(
    search: Optional[str] = Query(None, description="Search by name or category"),
    category: Optional[str] = Query(None, description="Filter by category"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all suppliers for the current user's store
    """
    suppliers = get_user_suppliers(current_user.id)
    
    # Apply filters
    if search:
        search_lower = search.lower()
        suppliers = [s for s in suppliers if search_lower in s['name'].lower() or search_lower in s['category'].lower()]
    
    if category:
        suppliers = [s for s in suppliers if s['category'].lower() == category.lower()]
    
    return suppliers


@router.post("", response_model=dict)
async def create_supplier(
    supplier: SupplierCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new supplier
    """
    suppliers = get_user_suppliers(current_user.id)
    
    # Check if phone already exists
    if any(s['phone'] == supplier.phone for s in suppliers):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Supplier with this phone already exists"
        )
    
    new_supplier = {
        "id": len(suppliers) + 1 if suppliers else 1,
        "name": supplier.name,
        "contact": supplier.contact,
        "phone": supplier.phone,
        "email": supplier.email,
        "address": supplier.address,
        "category": supplier.category,
        "rating": 4.0,
        "total_orders": 0,
        "pending_amount": 0.0,
        "last_order": None,
        "created_at": datetime.utcnow().isoformat()
    }
    
    suppliers.insert(0, new_supplier)
    save_user_suppliers(current_user.id, suppliers)
    
    return new_supplier


@router.get("/{supplier_id}", response_model=dict)
async def get_supplier(
    supplier_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific supplier by ID
    """
    suppliers = get_user_suppliers(current_user.id)
    supplier = next((s for s in suppliers if s['id'] == supplier_id), None)
    
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found"
        )
    
    return supplier


@router.put("/{supplier_id}", response_model=dict)
async def update_supplier(
    supplier_id: int,
    supplier_update: SupplierUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a supplier
    """
    suppliers = get_user_suppliers(current_user.id)
    supplier_index = next((i for i, s in enumerate(suppliers) if s['id'] == supplier_id), None)
    
    if supplier_index is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found"
        )
    
    # Update fields
    update_data = supplier_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            suppliers[supplier_index][key] = value
    
    save_user_suppliers(current_user.id, suppliers)
    
    return suppliers[supplier_index]


@router.delete("/{supplier_id}")
async def delete_supplier(
    supplier_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a supplier
    """
    suppliers = get_user_suppliers(current_user.id)
    supplier_index = next((i for i, s in enumerate(suppliers) if s['id'] == supplier_id), None)
    
    if supplier_index is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found"
        )
    
    deleted_supplier = suppliers.pop(supplier_index)
    save_user_suppliers(current_user.id, suppliers)
    
    return {"message": f"Supplier '{deleted_supplier['name']}' deleted successfully"}


# ==================== PURCHASE ORDERS ====================

@router.get("/orders/list", response_model=List[dict])
async def get_purchase_orders(
    status: Optional[str] = Query(None, description="Filter by status"),
    supplier_id: Optional[int] = Query(None, description="Filter by supplier"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all purchase orders
    """
    orders = get_user_orders(current_user.id)
    
    if status:
        orders = [o for o in orders if o['status'] == status]
    
    if supplier_id:
        orders = [o for o in orders if o['supplier_id'] == supplier_id]
    
    return orders


@router.post("/orders", response_model=dict)
async def create_purchase_order(
    order: PurchaseOrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new purchase order
    """
    suppliers = get_user_suppliers(current_user.id)
    supplier = next((s for s in suppliers if s['id'] == order.supplier_id), None)
    
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found"
        )
    
    orders = get_user_orders(current_user.id)
    
    # Calculate total
    total_amount = sum(item.quantity * item.unit_price for item in order.items)
    
    # Generate order number
    order_number = f"PO-{datetime.utcnow().strftime('%Y')}-{str(len(orders) + 1).zfill(4)}"
    
    new_order = {
        "id": len(orders) + 1 if orders else 1,
        "order_no": order_number,
        "supplier_id": order.supplier_id,
        "supplier_name": supplier['name'],
        "items": [item.dict() for item in order.items],
        "item_count": len(order.items),
        "amount": total_amount,
        "status": "pending",
        "notes": order.notes,
        "date": datetime.utcnow().isoformat(),
        "expected_delivery": None,
        "created_at": datetime.utcnow().isoformat()
    }
    
    orders.insert(0, new_order)
    save_user_orders(current_user.id, orders)
    
    # Update supplier stats
    supplier['total_orders'] += 1
    supplier['pending_amount'] += total_amount
    supplier['last_order'] = datetime.utcnow().isoformat()
    save_user_suppliers(current_user.id, suppliers)
    
    return new_order


@router.put("/orders/{order_id}/status", response_model=dict)
async def update_order_status(
    order_id: int,
    status: str = Query(..., description="New status: pending, confirmed, shipped, delivered, cancelled"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update purchase order status
    """
    valid_statuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    orders = get_user_orders(current_user.id)
    order_index = next((i for i, o in enumerate(orders) if o['id'] == order_id), None)
    
    if order_index is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    old_status = orders[order_index]['status']
    orders[order_index]['status'] = status
    
    # If delivered, clear pending amount from supplier
    if status == "delivered" and old_status != "delivered":
        suppliers = get_user_suppliers(current_user.id)
        supplier = next((s for s in suppliers if s['id'] == orders[order_index]['supplier_id']), None)
        if supplier:
            supplier['pending_amount'] = max(0, supplier['pending_amount'] - orders[order_index]['amount'])
            save_user_suppliers(current_user.id, suppliers)
    
    save_user_orders(current_user.id, orders)
    
    return orders[order_index]


@router.post("/{supplier_id}/payment", response_model=dict)
async def record_supplier_payment(
    supplier_id: int,
    payment: SupplierPayment,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Record a payment to supplier
    """
    suppliers = get_user_suppliers(current_user.id)
    supplier_index = next((i for i, s in enumerate(suppliers) if s['id'] == supplier_id), None)
    
    if supplier_index is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found"
        )
    
    if payment.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment amount must be positive"
        )
    
    supplier = suppliers[supplier_index]
    new_pending = max(0, supplier['pending_amount'] - payment.amount)
    supplier['pending_amount'] = new_pending
    
    save_user_suppliers(current_user.id, suppliers)
    
    return {
        "message": f"Payment of ₹{payment.amount} recorded",
        "new_pending": new_pending,
        "supplier": supplier
    }


@router.get("/stats/summary", response_model=dict)
async def get_supplier_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get supplier statistics
    """
    suppliers = get_user_suppliers(current_user.id)
    orders = get_user_orders(current_user.id)
    
    total_suppliers = len(suppliers)
    total_pending = sum(s['pending_amount'] for s in suppliers)
    pending_orders = sum(1 for o in orders if o['status'] == 'pending')
    total_orders = len(orders)
    
    return {
        "total_suppliers": total_suppliers,
        "total_pending": total_pending,
        "pending_orders": pending_orders,
        "total_orders": total_orders
    }
