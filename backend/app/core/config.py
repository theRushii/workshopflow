from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    SECRET_KEY: str = "dev-secret-key-change-in-production-please"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    DATABASE_URL: str = "sqlite:///./workshopflow.db"

    ADMIN_EMAIL: str = "admin@workshopflow.local"
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "Admin@123"

    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    DEFAULT_TAX_RATE: float = 18.0

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
