import asyncio
import random
from datetime import datetime

import httpx
from sqlmodel import select

from ..core.config import settings
from ..db.session import async_session
from ..models.payment import PaymentAttempt
from ..schemas import PaymentStatus, WebhookPayload
from ..utils.signing import sign


async def simulate_payment_workflow(attempt_id: str) -> None:
    # Simular latencia de procesamiento
    await asyncio.sleep(random.uniform(1.5, 3.5))

    # 1) Recuperar el intento de pago
    async with async_session() as session:
        attempt = await session.get(PaymentAttempt, attempt_id)
        if not attempt:
            # Nada que hacer si el intento ya no existe
            return

        # 2) Decidir resultado aleatorio (éxito / fallo)
        status = random.choice([PaymentStatus.SUCCESS, PaymentStatus.FAILED])
        attempt.state = status.value
        attempt.processed_at = datetime.utcnow()

        # 3) Construir payload del webhook
        payload = WebhookPayload(
            order_id=attempt.order_id,
            status=status,
            transaction_id=attempt.id,
        )

        # Guardar el payload en la DB (por trazabilidad)
        attempt.webhook_payload = payload.model_dump(by_alias=True)

        await session.commit()

    # 4) Enviar webhook firmado al Order Service
    body = payload.model_dump_json(by_alias=True).encode("utf-8")
    signature = sign(body)

    webhook_sent = False

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(
                settings.order_service_webhook,
                content=body,
                headers={
                    "Content-Type": "application/json",
                    "X-Signature": signature,
                    "X-Transaction-Id": payload.transaction_id,
                },
                timeout=5.0,
            )
            resp.raise_for_status()
            webhook_sent = True
        except Exception:
            # Aquí podrías loguear el error, reintentos, etc.
            webhook_sent = False

    # 5) Marcar en la DB si el webhook se envió correctamente
    if webhook_sent:
        async with async_session() as session:
            attempt = await session.get(PaymentAttempt, attempt_id)
            if attempt:
                attempt.webhook_sent = True
                await session.commit()
