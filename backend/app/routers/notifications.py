from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.models.schemas import Notification as NotificationSchema, TokenData
from app.deps import get_current_tenant_user
from app.database import get_db
from sqlalchemy.orm import Session
from app.models.sql_models import Notification as SQLNotification
from sqlalchemy import desc

router = APIRouter(prefix="/tenant/notifications", tags=["notifications"])

@router.get("/", response_model=List[NotificationSchema])
async def get_notifications(
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    """Get all notifications for the tenant, ordered by newest first."""
    notifications = db.query(SQLNotification).filter(
        SQLNotification.tenant_id == current_user.tenant_id
    ).order_by(desc(SQLNotification.created_at)).limit(50).all()
    return notifications

@router.get("/unread-count")
async def get_unread_count(
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    """Get the number of unread notifications."""
    count = db.query(SQLNotification).filter(
        SQLNotification.tenant_id == current_user.tenant_id,
        SQLNotification.read == False
    ).count()
    return {"count": count}

@router.post("/{notification_id}/read")
async def mark_as_read(
    notification_id: str,
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    """Mark a notification as read."""
    notification = db.query(SQLNotification).filter(
        SQLNotification.id == notification_id,
        SQLNotification.tenant_id == current_user.tenant_id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.read = True
    db.commit()
    return {"message": "Success"}

@router.post("/read-all")
async def mark_all_as_read(
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    """Mark all unread notifications for the tenant as read."""
    db.query(SQLNotification).filter(
        SQLNotification.tenant_id == current_user.tenant_id,
        SQLNotification.read == False
    ).update({"read": True})
    db.commit()
    return {"message": "Success"}

@router.post("/push-subscribe")
async def subscribe_push(
    subscription: dict,
    current_user: TokenData = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    """Saves a push subscription for the user."""
    from app.models.sql_models import PushSubscription
    
    # Check if subscription already exists for this user/device? 
    # For now, we update or create.
    db_sub = db.query(PushSubscription).filter(
        PushSubscription.user_id == current_user.user_id,
        # Potentially matching the endpoint in JSON
    ).first()

    if not db_sub:
        db_sub = PushSubscription(
            tenant_id=current_user.tenant_id,
            user_id=current_user.user_id,
            subscription_json=subscription
        )
        db.add(db_sub)
    else:
        db_sub.subscription_json = subscription
    
    db.commit()
    return {"message": "Inscrição de notificações salva com sucesso"}
