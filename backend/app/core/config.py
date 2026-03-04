from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    VERSION: str = "0.1.0"
    DATABASE_URL: str = "postgresql+asyncpg://friday:friday_local@db:5432/friday"
    DATABASE_URL_SYNC: str = "postgresql://friday:friday_local@db:5432/friday"
    REDIS_URL: str = "redis://redis:6379/0"
    SECRET_KEY: str = "dev-secret-key"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "FRIDAY"
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:3001"]
    OPENAI_API_KEY: str = ""
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_RECYCLE: int = 1800
    RATE_LIMIT_PER_MINUTE: int = 200
    AI_RATE_LIMIT_PER_MINUTE: int = 10
    BULK_RATE_LIMIT_PER_MINUTE: int = 20
    UPLOAD_DIR: str = "/app/uploads"

    # Storage
    STORAGE_BACKEND: str = "local"  # "local" or "s3"
    S3_BUCKET: str = ""
    S3_REGION: str = "us-east-1"
    S3_ENDPOINT: str = ""  # For MinIO/LocalStack

    # Email
    EMAIL_ENABLED: bool = False
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 587
    SMTP_USE_TLS: bool = True
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "friday@example.com"
    APP_URL: str = "http://localhost:3000"

    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
    }


settings = Settings()
