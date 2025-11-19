from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any

from pydantic import BaseModel, Field


class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"


class PaymentRequest(BaseModel):
    # Llega desde Node como "orderId"
    order_id: str = Field(..., alias="orderId")
    amount: float
    currency: str
    # Llega como "paymentMethod"
    payment_method: str = Field(..., alias="paymentMethod")
    metadata: Optional[Dict[str, Any]] = None

    class Config:
        allow_population_by_field_name = True


class PaymentResponse(BaseModel):
    # Devolvemos "transactionId" en JSON
    transaction_id: str = Field(..., alias="transactionId")
    status: PaymentStatus
    received_at: datetime

    class Config:
        allow_population_by_field_name = True


class WebhookPayload(BaseModel):
    # Enviamos al Order Service usando camelCase
    order_id: str = Field(..., alias="orderId")
    status: PaymentStatus
    transaction_id: str = Field(..., alias="transactionId")

    class Config:
        allow_population_by_field_name = True
