from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"


class PaymentRequest(BaseModel):
    order_id: str
    amount: float
    currency: str
    payment_method: str
    metadata: Optional[dict] = None


class PaymentResponse(BaseModel):
    transaction_id: str
    status: PaymentStatus
    received_at: datetime


class WebhookPayload(BaseModel):
    order_id: str
    status: PaymentStatus
    transaction_id: str
