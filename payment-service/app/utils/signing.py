import hashlib
import hmac

from ..core.config import settings


def sign(payload: bytes) -> str:
    secret = settings.signing_secret.encode()
    digest = hmac.new(secret, payload, hashlib.sha256).hexdigest()
    return f"sha256={digest}"


def verify(signature: str, payload: bytes) -> bool:
    expected = sign(payload)
    return hmac.compare_digest(expected, signature)
