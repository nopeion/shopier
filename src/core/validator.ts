import { ShopierConfig, BuyerInfo } from '../types';
import { InvalidApiKeyError, InvalidApiSecretError, ValidationError } from '../errors';

/**
 * Validates the Shopier configuration.
 * Checks for API key and API secret, with environment variable fallback.
 * @throws InvalidApiKeyError if API key is missing
 * @throws InvalidApiSecretError if API secret is missing
 */
export function validateConfig(config: ShopierConfig): void {
  const apiKey = config.apiKey || process.env.SHOPIER_API_KEY;
  const apiSecret = config.apiSecret || process.env.SHOPIER_API_SECRET;

  if (!apiKey || apiKey.trim() === '') {
    throw new InvalidApiKeyError('API key is missing or empty');
  }

  if (!apiSecret || apiSecret.trim() === '') {
    throw new InvalidApiSecretError('API secret is missing or empty');
  }
}

/**
 * Validates buyer information.
 * @throws ValidationError if required fields are missing
 */
export function validateBuyer(buyer: BuyerInfo): void {
  const requiredFields: (keyof BuyerInfo)[] = ['id', 'firstName', 'lastName', 'email', 'phone', 'productName'];
  const missingFields: string[] = [];

  for (const field of requiredFields) {
    const value = buyer[field];
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
      missingFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    throw new ValidationError(
      `Missing required buyer fields: ${missingFields.join(', ')}`,
      { missingFields }
    );
  }

  // Validate email format
  if (!validateEmail(buyer.email)) {
    throw new ValidationError('Invalid email format', { field: 'email', value: buyer.email });
  }

  // Validate phone format
  if (!validatePhone(buyer.phone)) {
    throw new ValidationError('Invalid phone number format', { field: 'phone', value: buyer.phone });
  }
}


/**
 * Validates the payment amount.
 * @throws ValidationError if amount is zero, negative, NaN, or Infinity
 */
export function validateAmount(amount: number): void {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ValidationError('Amount must be a valid positive number', { field: 'amount', value: amount });
  }
}

/**
 * Validates email format.
 * @returns true if email format is valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  // Basic email regex pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates phone number format.
 * @returns true if phone format is valid, false otherwise
 */
export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  // Allow digits, spaces, dashes, parentheses, and plus sign
  // Minimum 7 digits for a valid phone number
  const digitsOnly = phone.replace(/[\s\-\(\)\+]/g, '');
  return /^\d{7,15}$/.test(digitsOnly);
}

/**
 * Validates installment limit.
 * @throws ValidationError if installment is outside valid range (0-12)
 * Note: 0 means no installment (single payment)
 */
export function validateInstallment(installment: number): void {
  if (!Number.isInteger(installment) || installment < 0 || installment > 12) {
    throw new ValidationError(
      'Installment must be an integer between 0 and 12',
      { field: 'installment', value: installment }
    );
  }
}
