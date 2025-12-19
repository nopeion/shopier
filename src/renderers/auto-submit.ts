import { FormData } from '../types';
import { Language } from '../enums';
import { escapeHtml } from '../utils';
import { renderHiddenInputs } from './hidden-inputs';

/**
 * Renders a complete HTML page that automatically submits the payment form on load.
 * 
 * @param formData - The form data to submit
 * @param actionUrl - The Shopier action URL
 * @param language - The language for the loading message (default: TR)
 * @returns Complete HTML page string with auto-submit functionality
 */
export function renderAutoSubmitHTML(
  formData: FormData,
  actionUrl: string,
  language: Language = Language.TR
): string {
  const escapedActionUrl = escapeHtml(actionUrl);
  const hiddenInputs = renderHiddenInputs(formData);
  
  const loadingMessage = language === Language.EN 
    ? 'Redirecting to payment page...' 
    : 'Ödeme sayfasına yönlendiriliyorsunuz...';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shopier Payment</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background-color: #f5f5f5;
    }
    .loading {
      text-align: center;
      color: #333;
    }
    .spinner {
      border: 3px solid #f3f3f3;
      border-top: 3px solid #3498db;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="loading">
    <div class="spinner"></div>
    <p>${escapeHtml(loadingMessage)}</p>
  </div>
  <form id="shopier-form" action="${escapedActionUrl}" method="POST">
${hiddenInputs}
  </form>
  <script>
    document.getElementById('shopier-form').submit();
  </script>
</body>
</html>`;
}
