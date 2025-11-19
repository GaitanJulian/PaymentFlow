from pydantic import BaseSettings, AnyUrl


class Settings(BaseSettings):
    app_name: str = "Payment Service"
    port: int = 8000
    database_url: str
    signing_secret: str
    order_service_webhook: AnyUrl

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
