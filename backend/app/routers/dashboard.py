"""
KadaiGPT - Dashboard Stats Router
Provides real-time statistics for the dashboard
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta
from typing import Optional

from app.database import get_db
from app.models import User, Bill, Product
from app.routers.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get dashboard statistics for the current user
    """
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    try:
        # Get today's bills
        bills_result = await db.execute(
            select(Bill)
            .where(Bill.user_id == current_user.id)
            .where(Bill.created_at >= today)
        )
        today_bills = bills_result.scalars().all()
        
        # Get all products
        products_result = await db.execute(
            select(Product)
            .where(Product.user_id == current_user.id)
        )
        products = products_result.scalars().all()
        
        # Calculate stats
        today_sales = sum(float(bill.total or 0) for bill in today_bills)
        today_bills_count = len(today_bills)
        avg_bill_value = today_sales / today_bills_count if today_bills_count > 0 else 0
        low_stock_count = sum(1 for p in products if (p.stock or 0) <= (p.min_stock or 10))
        
        return {
            "todaySales": round(today_sales, 2),
            "todayBills": today_bills_count,
            "avgBillValue": round(avg_bill_value, 2),
            "lowStockCount": low_stock_count,
            "totalProducts": len(products),
            "lastUpdated": datetime.now().isoformat()
        }
    except Exception as e:
        # Return default stats if database query fails
        return {
            "todaySales": 0,
            "todayBills": 0,
            "avgBillValue": 0,
            "lowStockCount": 0,
            "totalProducts": 0,
            "lastUpdated": datetime.now().isoformat(),
            "error": str(e)
        }


@router.get("/activity")
async def get_activity_feed(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get recent activity feed for the dashboard
    """
    activities = []
    
    try:
        # Get recent bills
        bills_result = await db.execute(
            select(Bill)
            .where(Bill.user_id == current_user.id)
            .order_by(Bill.created_at.desc())
            .limit(5)
        )
        recent_bills = bills_result.scalars().all()
        
        for bill in recent_bills:
            time_ago = get_time_ago(bill.created_at)
            activities.append({
                "id": f"bill_{bill.id}",
                "type": "sale",
                "message": f"New bill #{bill.bill_number} created",
                "time": time_ago,
                "amount": float(bill.total or 0)
            })
        
        # Get low stock products
        products_result = await db.execute(
            select(Product)
            .where(Product.user_id == current_user.id)
            .where(Product.stock <= Product.min_stock)
            .limit(3)
        )
        low_stock = products_result.scalars().all()
        
        for product in low_stock:
            activities.append({
                "id": f"stock_{product.id}",
                "type": "stock",
                "message": f"Low stock alert: {product.name} ({product.stock} left)",
                "time": "now"
            })
        
        return activities[:limit]
    except Exception:
        return []


def get_time_ago(dt: datetime) -> str:
    """Convert datetime to human-readable time ago string"""
    if not dt:
        return "unknown"
    
    now = datetime.now()
    diff = now - dt
    
    seconds = diff.total_seconds()
    
    if seconds < 60:
        return "just now"
    elif seconds < 3600:
        minutes = int(seconds / 60)
        return f"{minutes} min ago"
    elif seconds < 86400:
        hours = int(seconds / 3600)
        return f"{hours} hour{'s' if hours > 1 else ''} ago"
    else:
        days = int(seconds / 86400)
        return f"{days} day{'s' if days > 1 else ''} ago"


@router.get("/insights")
async def get_ai_insights(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get AI-generated insights for the business
    """
    insights = []
    
    try:
        # Get product data
        products_result = await db.execute(
            select(Product)
            .where(Product.user_id == current_user.id)
        )
        products = products_result.scalars().all()
        
        # Low stock insight
        low_stock_products = [p for p in products if (p.stock or 0) <= (p.min_stock or 10)]
        if low_stock_products:
            insights.append({
                "icon": "📦",
                "title": "Stock Alert",
                "text": f"{len(low_stock_products)} products are running low. Consider reordering soon.",
                "priority": "high"
            })
        
        # High value inventory
        high_value = sorted(products, key=lambda p: (p.stock or 0) * (p.price or 0), reverse=True)[:3]
        if high_value:
            total_value = sum((p.stock or 0) * (p.price or 0) for p in products)
            insights.append({
                "icon": "💰",
                "title": "Inventory Value",
                "text": f"Your inventory is worth ₹{total_value:,.0f}. Top item: {high_value[0].name if high_value else 'N/A'}",
                "priority": "medium"
            })
        
        # General tips
        insights.append({
            "icon": "💡",
            "title": "Pro Tip",
            "text": "Scan handwritten bills with our OCR feature to save time on data entry!",
            "priority": "low"
        })
        
        return {"insights": insights}
    except Exception as e:
        return {
            "insights": [
                {
                    "icon": "🚀",
                    "title": "Welcome",
                    "text": "Add products and start creating bills to see AI-powered insights!",
                    "priority": "low"
                }
            ]
        }
