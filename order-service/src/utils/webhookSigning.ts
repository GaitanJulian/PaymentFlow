import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.ORDER_WEBHOOK_SECRET || 'supersecret';
const SIGNATURE_PREFIX = 'sha256=';

function stripSignaturePrefix(signature?: string): string | null {
  if (!signature) {
    return null;
  }

  if (signature.startsWith(SIGNATURE_PREFIX)) {
    return signature.slice(SIGNATURE_PREFIX.length);
  }

  return signature;
}

export function verifyWebhookSignature(rawBody: Buffer, signatureHeader?: string): boolean {
  const signature = stripSignaturePrefix(signatureHeader);
  if (!signature) {
    return false;
  }

  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature, 'hex')
    );
  } catch {
    // timingSafeEqual lanza si las longitudes no coinciden
    return false;
  }
}
