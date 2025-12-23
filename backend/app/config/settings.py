from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import EmailStr

class Settings(BaseSettings):
    """
    Cấu hình website, nạp từ biến môi trường .env được viết trước đó
    """

    # Postgres
    DATABASE_URL: str

    # Object storage S3
    S3_PUBLIC_ENDPOINT: str | None = None
    S3_ACCESS_KEY: str
    S3_SECRET_KEY: str
    S3_BUCKET: str
    S3_REGION: str = "ap-southeast-1"

    #OAUTH
    OAUTH2_SECRET_KEY: str
    OAUTH2_ALGORITHM: str = "HS256"
    OAUTH2_ACCESS_TOKEN_EXPIRE_MINUTES: int = 180
    OAUTH2_REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    #GOOGLE AUTH API
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_REDIRECT_URI: str

    SECRET_KEY: str

    #SEND EMAIL
    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: EmailStr
    MAIL_PORT: int
    MAIL_SERVER: str
    MAIL_FROM_NAME: str

    RESET_PASSWORD_TOKEN_EXPIRE_MINUTES: int = 5

    #MONGODB
    MONGO_URL: str
    MONGO_DB_NAME: str

    FRONTEND_BUYER_URL: str = "http://localhost:3000"
    FRONTEND_SELLER_URL: str = "http://localhost:3001"
    FRONTEND_ADMIN_URL: str =  "http://localhost:3002"

    DEFAULT_BUYER_HOME: str = "/"
    DEFAULT_SELLER_HOME: str = "/products"

    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str

    REDIS_DB_BROKER: int = 0
    REDIS_DB_BACKEND: int = 1
    REDIS_DB_CACHE: int = 2

    @property
    def redis_url_broker(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB_BROKER}"

    @property
    def redis_url_backend(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB_BACKEND}"

    @property
    def redis_url_cache(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB_CACHE}"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
