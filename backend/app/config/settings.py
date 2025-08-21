from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Cấu hình website, nạp từ biến môi trường .env được viết trước đó
    """

    # Đường dẫn database postgresql
    DATABASE_URL: str

    # Object storage (MinIO or S3-compatible)
    S3_ENDPOINT: str
    S3_PUBLIC_ENDPOINT: str | None = None
    S3_ACCESS_KEY: str
    S3_SECRET_KEY: str
    S3_BUCKET: str
    S3_REGION: str = "us-east-1"

    JWT_SECRET: str
    JWT_ALG: str = "HS256"
    JWT_EXPIRE_MIN: int = 60

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
