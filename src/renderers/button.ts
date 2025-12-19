import { FormData, ButtonOptions } from '../types';
import { Language } from '../enums';
import { escapeHtml } from '../utils';
import { renderHiddenInputs } from './hidden-inputs';

/**
 * Default button text by language
 */
const DEFAULT_BUTTON_TEXT: Record<Language, string> = {
  [Language.TR]: 'Shopier ile Öde',
  [Language.EN]: 'Pay with Shopier',
};

/**
 * Renders a styled "Pay with Shopier" button that submits a hidden form when clicked.
 * 
 * @param formData - The form data to submit
 * @param actionUrl - The Shopier action URL
 * @param options - Optional button customization options
 * @returns HTML string containing a button and hidden form
 */
export function renderButton(
  formData: FormData,
  actionUrl: string,
  options: ButtonOptions = {}
): string {
  const escapedActionUrl = escapeHtml(actionUrl);
  const hiddenInputs = renderHiddenInputs(formData);

  // Determine language from form data
  const language = formData.current_language === Language.EN ? Language.EN : Language.TR;

  // Get button text with fallback to default
  const buttonText = options.buttonText
    ? escapeHtml(options.buttonText)
    : DEFAULT_BUTTON_TEXT[language];

  // Build class attribute
  const className = options.className
    ? `shopier-button ${escapeHtml(options.className)}`
    : 'shopier-button';

  // Build style attribute
  const styleAttr = options.style
    ? ` style="${escapeHtml(options.style)}"`
    : '';

  const formId = escapeHtml(`shopier-form-${formData.random_nr}`);

  return `<style>
.shopier-button {
  background-color: #4CAF50;
  border: none;
  color: white;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}
.shopier-button:hover {
  background-color: #45a049;
}
.shopier-button:active {
  background-color: #3d8b40;
}
</style>
<form id="${formId}" action="${escapedActionUrl}" method="POST" style="display:inline;">
${hiddenInputs}
  <button type="submit" class="${className}"${styleAttr}>${buttonText}</button>
</form>`;
}
