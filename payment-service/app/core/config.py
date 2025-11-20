from pydantic import BaseSettings, AnyUrl


class Settings(BaseSettings):
    app_name: str = "Payment Service"
    port: int = 8000
    database_url: str
    signing_secret: str
    order_service_webhook: str = "http://order-service:4000/api/webhooks/payment"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
