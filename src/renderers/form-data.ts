import { FormData, FormDataResult } from '../types';

/**
 * Default Shopier action URL
 */
const SHOPIER_ACTION_URL = 'https://www.shopier.com/ShowProduct/api_pay4.php';

/**
 * Returns a plain JavaScript object containing all form fields and the action URL.
 * This is useful for frameworks that need to handle form submission programmatically.
 * 
 * @param formData - The form data object
 * @param actionUrl - Optional custom action URL (defaults to Shopier's payment URL)
 * @returns FormDataResult containing formData and actionUrl
 */
export function getFormDataObject(
  formData: FormData,
  actionUrl: string = SHOPIER_ACTION_URL
): FormDataResult {
  return {
    formData,
    actionUrl,
  };
}
