import { FormData } from '../types';
import { escapeHtml } from '../utils';

/**
 * Renders hidden input elements for Shopier payment form.
 * All values are properly escaped to prevent XSS attacks.
 * 
 * @param formData - The form data to render as hidden inputs
 * @returns HTML string containing only hidden input elements
 */
export function renderHiddenInputs(formData: FormData): string {
  const inputs: string[] = [];

  for (const [key, value] of Object.entries(formData)) {
    const escapedKey = escapeHtml(key);
    const escapedValue = escapeHtml(String(value));
    inputs.push(`<input type="hidden" name="${escapedKey}" value="${escapedValue}" />`);
  }

  return inputs.join('\n');
}
