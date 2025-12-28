import asyncio
from datetime import datetime, timezone
from sqlalchemy import select
from ..utils.celery_client import celery_app
from ..config.db import AsyncSessionLocal
from ..models.users import Admin
from ..models.notification import Notification
from ..utils.socket_manager import socket_manager


def run_async(coro):
    return asyncio.get_event_loop().run_until_complete(coro)


@celery_app.task(name="task_send_notification")
def task_send_notification(
        user_id: int, role: str,
        title: str, message: str,
        event_type: str, data: dict
):
    """Unicast: Gửi cho 1 người"""

    async def _process():
        notif = Notification(
            recipient_id=user_id, recipient_role=role, title=title,
             message=message, event_type=event_type, data=data or {},
             created_at=datetime.now(timezone.utc), is_read=False
        )
        await notif.insert()

        ws_payload = {
            "type": "NOTIFICATION",
            "id": str(notif.id),
            "title": title,
            "message": message,
            "data": data
        }
        await socket_manager.send_to_user(ws_payload, user_id, role)

    run_async(_process())


@celery_app.task(name="task_broadcast_admin_notification")
def task_broadcast_admin_notification(title: str, message: str,
                                      event_type: str, data: dict
):
    """Broadcast: Gửi cho toàn bộ Admin"""

    async def _process():
        async with AsyncSessionLocal() as db:
            admins = (await db.execute(select(Admin))).scalars().all()
            docs = [
                Notification(
                        recipient_id=a.admin_id, recipient_role="admin", title=title,
                        message=message, event_type=event_type, data=data or {},
                        created_at=datetime.now(timezone.utc), is_read=False
                ) for a in admins if a.admin_id
            ]
            if docs: await Notification.insert_many(docs)

            for n in docs:
                ws_payload = {
                    "type": "NOTIFICATION",
                    "id": str(n.id),
                    "title": title,
                    "message": message,
                    "data": data
                }
                await socket_manager.send_to_user(ws_payload, n.recipient_id, "admin")

    run_async(_process())