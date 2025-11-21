import asyncio
import httpx
import random
from datetime import datetime

from sqlmodel import select

from ..core.config import settings
from ..db.session import async_session
from ..models.payment import PaymentAttempt
from ..schemas import PaymentStatus, WebhookPayload
from ..utils.signing import sign





async def simulate_payment_workflow(attempt_id: str) -> None:
    await asyncio.sleep(random.uniform(1.5, 3.5))

    status = random.choices(
        [PaymentStatus.SUCCESS, PaymentStatus.FAILED],
        weights=[0.75, 0.25],
    )[0]

    async with async_session() as session:
        statement = select(PaymentAttempt).where(PaymentAttempt.id == attempt_id)
        result = await session.execute(statement)
        payment = result.scalar_one_or_none()
        if not payment:
            return

        payment.state = status.value
        payment.processed_at = datetime.utcnow()

        payload = WebhookPayload(
            order_id=payment.order_id,
            status=status,
            transaction_id=payment.id,
        )

        # Guardamos el JSON que se envía (con alias camelCase) en la columna
        payment.webhook_payload = payload.dict(by_alias=True)

        await session.commit()

    await dispatch_webhook(payload, payment.id)


async def dispatch_webhook(payload: WebhookPayload, transaction_id: str) -> None:
    body = payload.json(by_alias=True).encode("utf-8")
    signature = sign(body)

    backoff_seconds = [1.0, 2.0, 4.0]

    for attempt in range(1, len(backoff_seconds) + 2):
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    settings.order_service_webhook,
                    content=body,
                    headers={
                        "Content-Type": "application/json",
                        "X-Signature": signature,
                        "X-Transaction-Id": transaction_id,
                    },
                    timeout=5.0,
                )
                resp.raise_for_status()

            # Si llegamos aquí, el webhook fue exitoso
            async with async_session() as session:
                payment = await session.get(PaymentAttempt, transaction_id)
                if payment:
                    payment.webhook_sent = True
                    await session.commit()

            return
        except Exception as e:
            print(f"Webhook attempt {attempt} failed: {e}")
            if attempt >= len(backoff_seconds) + 1:
                # Dejamos webhook_sent = False y salimos
                return
            await asyncio.sleep(backoff_seconds[attempt - 1])