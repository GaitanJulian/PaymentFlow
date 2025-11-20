from datetime import datetime
from typing import Optional, Dict, Any
from uuid import uuid4  # <- IMPORTANTE

from sqlalchemy import Column, JSON
from sqlmodel import SQLModel, Field


class PaymentAttempt(SQLModel, table=True):
    # Generamos un UUID string por defecto para cada intento
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)

    order_id: str
    amount: float
    currency: str
    state: str
    idempotency_key: str

    # Campos JSON
    extra_metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        sa_column=Column(JSON),
    )
    webhook_payload: Optional[Dict[str, Any]] = Field(
        default=None,
        sa_column=Column(JSON),
    )

    webhook_sent: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    processed_at: Optional[datetime] = None
