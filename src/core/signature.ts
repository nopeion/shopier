import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Generates an HMAC-SHA256 signature encoded in base64.
 * @param secret - The API secret key
 * @param data - The data to sign
 * @returns Base64-encoded HMAC-SHA256 signature
 */
export function generateSignature(secret: string, data: string): string {
  const hmac = createHmac('sha256', secret);
  hmac.update(data);
  return hmac.digest('base64');
}

/**
 * Verifies if a signature matches the expected signature for the given data.
 * Uses constant-time comparison to prevent timing attacks.
 * @param secret - The API secret key
 * @param data - The data that was signed
 * @param signature - The signature to verify
 * @returns True if the signature is valid, false otherwise
 */
export function verifySignature(secret: string, data: string, signature: string): boolean {
  const expectedSignature = generateSignature(secret, data);

  // Use constant-time comparison to prevent timing attacks
  try {
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const signatureBuffer = Buffer.from(signature, 'utf8');

    // Lengths must match for timingSafeEqual
    if (expectedBuffer.length !== signatureBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, signatureBuffer);
  } catch {
    return false;
  }
}

/**
 * Generates a signature for payment form data.
 * The signature is computed from: randomNr + orderId + amount + currency
 * @param secret - The API secret key
 * @param randomNr - The random number for this transaction
 * @param orderId - The platform order ID
 * @param amount - The payment amount
 * @param currency - The currency code (0=TL, 1=USD, 2=EUR)
 * @returns Base64-encoded HMAC-SHA256 signature
 */
export function generatePaymentSignature(
  secret: string,
  randomNr: number,
  orderId: string,
  amount: number,
  currency: number
): string {
  const data = `${randomNr}${orderId}${amount}${currency}`;
  return generateSignature(secret, data);
}

/**
 * Generates a signature for callback verification.
 * The signature is computed from: randomNr + orderId
 * @param secret - The API secret key
 * @param randomNr - The random number from the callback
 * @param orderId - The platform order ID from the callback
 * @returns Base64-encoded HMAC-SHA256 signature
 */
export function generateCallbackSignature(
  secret: string,
  randomNr: string,
  orderId: string
): string {
  const data = `${randomNr}${orderId}`;
  return generateSignature(secret, data);
}
