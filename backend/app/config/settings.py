from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import EmailStr

class Settings(BaseSettings):
    """
    Cấu hình website, nạp từ biến môi trường .env được viết trước đó
    """

    # Đường dẫn database postgresql
    DATABASE_URL: str

    # Object storage (MinIO or S3-compatible)
    S3_PUBLIC_ENDPOINT: str | None = None
    S3_ACCESS_KEY: str
    S3_SECRET_KEY: str
    S3_BUCKET: str
    S3_REGION: str = "ap-southeast-1"

    OAUTH2_SECRET_KEY: str
    OAUTH2_ALGORITHM: str = "HS256"
    OAUTH2_ACCESS_TOKEN_EXPIRE_MINUTES: int = 180
    OAUTH2_REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_REDIRECT_URI: str

    SECRET_KEY: str

    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: EmailStr
    MAIL_PORT: int
    MAIL_SERVER: str
    MAIL_FROM_NAME: str

    RESET_PASSWORD_TOKEN_EXPIRE_MINUTES: int = 5

    MONGO_URL: str
    MONGO_DB_NAME: str

    FRONTEND_BUYER_URL: str = "http://localhost:3000"
    FRONTEND_SELLER_URL: str = "http://localhost:3001"
    FRONTEND_ADMIN_URL: str =  "http://localhost:3002"

    DEFAULT_BUYER_HOME: str = "/"
    DEFAULT_SELLER_HOME: str = "/products"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
