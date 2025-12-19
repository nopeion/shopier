/**
 * HTML special character escape map
 */
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
};

/**
 * Escapes HTML special characters to prevent XSS attacks.
 * Converts: & < > " ' to their HTML entity equivalents.
 * 
 * @param input - The string to escape
 * @returns The escaped string with HTML entities
 */
export function escapeHtml(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input.replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char] || char);
}
