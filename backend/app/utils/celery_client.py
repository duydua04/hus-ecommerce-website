from celery import Celery
from ..config.celery import celery_settings

celery_app = Celery("HUS_Ecommerce_Worker")
celery_app.config_from_object(celery_settings)

celery_app.conf.imports = [
    'app.tasks.email_task',
]