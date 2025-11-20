from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlmodel import select

from .db.session import async_session
from .models.payment import PaymentAttempt
from .schemas import PaymentRequest, PaymentResponse, PaymentStatus
from .services.payment_processor import simulate_payment_workflow

router = APIRouter()


@router.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.utcnow()}


async def get_session():
    async with async_session() as session:
        yield session


@router.post("/payments", response_model=PaymentResponse)
async def create_payment(
    payload: PaymentRequest,
    background_tasks: BackgroundTasks,
    idempotency_key: str = Header(None, alias="Idempotency-Key"),
    session=Depends(get_session),
):
    if not idempotency_key:
        raise HTTPException(status_code=400, detail="Idempotency-Key header is required")

    # 1) Buscar si ya existe un intento con esa idempotency key (idempotencia)
    result = await session.execute(
        select(PaymentAttempt).where(PaymentAttempt.idempotency_key == idempotency_key)
    )
    attempt = result.scalars().first()

    if attempt:
        # Devolver el mismo resultado (idempotente)
        return PaymentResponse(
            transaction_id=attempt.id,
            status=PaymentStatus(attempt.state),
            received_at=attempt.created_at,
        )

    # 2) Crear nuevo intento
    attempt = PaymentAttempt(
        order_id=payload.order_id,
        amount=payload.amount,
        currency=payload.currency,
        state=PaymentStatus.PENDING.value,
        idempotency_key=idempotency_key,
        extra_metadata={
            "paymentMethod": payload.payment_method,
            "metadata": payload.metadata,
        },
    )

    session.add(attempt)

    try:
        await session.commit()
        await session.refresh(attempt)
    except IntegrityError:
        # En caso de carrera: si otro proceso creó el mismo idempotency_key
        await session.rollback()
        result = await session.execute(
            select(PaymentAttempt).where(PaymentAttempt.idempotency_key == idempotency_key)
        )
        attempt = result.scalars().first()
        if not attempt:
            raise HTTPException(status_code=500, detail="Failed to handle idempotent payment")

    # 3) Lanzar el workflow en background
    background_tasks.add_task(simulate_payment_workflow, attempt.id)

    return PaymentResponse(
        transaction_id=attempt.id,
        status=PaymentStatus.PENDING,
        received_at=attempt.created_at,
    )
