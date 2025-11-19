from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException
from sqlmodel import select

from .db.session import async_session
from .models.payment import PaymentAttempt
from .schemas import PaymentRequest, PaymentResponse, PaymentStatus
from .services.payment_processor import simulate_payment_workflow

router = APIRouter()


@router.get('/health')
async def health():
    return {'status': 'ok', 'timestamp': datetime.utcnow()}


@router.get('/metrics')
async def metrics():
    return {'payment_requests': 0, 'payment_failures': 0}


@router.post('/payments', response_model=PaymentResponse)
async def create_payment(
    background_tasks: BackgroundTasks,
    payload: PaymentRequest,
    idempotency_key: str = Header(..., alias='Idempotency-Key')
):
    async with async_session() as session:
        statement = select(PaymentAttempt).where(PaymentAttempt.idempotency_key == idempotency_key)
        result = await session.execute(statement)
        existing = result.scalar_one_or_none()
        if existing:
            return PaymentResponse(
                transaction_id=existing.id,
                status=PaymentStatus(existing.state),
                received_at=existing.created_at
            )

        attempt = PaymentAttempt(
            order_id=payload.order_id,
            amount=payload.amount,
            currency=payload.currency,
            state=PaymentStatus.PENDING.value,
            idempotency_key=idempotency_key,
            metadata={'payment_method': payload.payment_method, 'metadata': payload.metadata}
        )
        session.add(attempt)
        await session.commit()
        await session.refresh(attempt)

    background_tasks.add_task(simulate_payment_workflow, attempt.id)

    return PaymentResponse(
        transaction_id=attempt.id,
        status=PaymentStatus.PENDING,
        received_at=attempt.created_at
    )
