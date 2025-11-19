from datetime import datetime
from typing import Optional
from uuid import uuid4

from sqlmodel import Field, SQLModel, Column
from sqlalchemy import JSON


class PaymentAttempt(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, index=True)
    order_id: str = Field(index=True)
    amount: float
    currency: str
    state: str = Field(sa_column=Column(default="PENDING", nullable=False))
    idempotency_key: str = Field(unique=True, index=True)
    metadata: Optional[dict] = Field(sa_column=Column(JSON, nullable=True))
    webhook_payload: Optional[dict] = Field(default=None, sa_column=Column(JSON, nullable=True))
    webhook_sent: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    processed_at: Optional[datetime] = None
