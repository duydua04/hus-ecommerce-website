from .settings import settings


class CeleryConfig:
    broker_url = settings.redis_url_broker
    result_backend = settings.redis_url_backend

    task_serializer = 'json'
    result_serializer = 'json'
    accept_content = ['json']
    timezone = 'Asia/Ho_Chi_Minh'
    enable_utc = True

    broker_connection_retry_on_startup = True


celery_settings = CeleryConfig()