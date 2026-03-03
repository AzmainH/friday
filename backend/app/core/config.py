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
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    OPENAI_API_KEY: str = ""
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_RECYCLE: int = 1800
    RATE_LIMIT_PER_MINUTE: int = 200
    UPLOAD_DIR: str = "/app/uploads"

    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
    }


settings = Settings()
