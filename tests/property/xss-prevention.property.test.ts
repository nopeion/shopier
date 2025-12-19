import * as fc from 'fast-check';
import { escapeHtml } from '../../src/utils';

/**
 * **Feature: shopier-sdk, Property 5: XSS Prevention**
 * **Validates: Requirements 3.5**
 * 
 * For any input string containing HTML special characters (<, >, ", ', &),
 * when rendered in any HTML output, these characters SHALL be properly escaped
 * to their HTML entity equivalents.
 */
describe('Property 5: XSS Prevention', () => {
  // HTML special characters and their expected escaped equivalents
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
  };

  it('should escape all HTML special characters to their entity equivalents', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (input) => {
          const escaped = escapeHtml(input);
          
          // Check that no unescaped special characters remain
          const hasUnescapedAmpersand = escaped.includes('&') && 
            !escaped.match(/&(amp|lt|gt|quot|#x27);/g)?.length;
          const hasUnescapedLt = escaped.includes('<');
          const hasUnescapedGt = escaped.includes('>');
          const hasUnescapedQuote = escaped.includes('"');
          const hasUnescapedApostrophe = escaped.includes("'");
          
          // All special chars should be escaped (none should remain unescaped)
          return !hasUnescapedLt && 
                 !hasUnescapedGt && 
                 !hasUnescapedQuote && 
                 !hasUnescapedApostrophe;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly escape each special character individually', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(htmlEscapeMap)),
        (char) => {
          const escaped = escapeHtml(char);
          return escaped === htmlEscapeMap[char];
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve non-special characters unchanged', () => {
    // Generate strings without HTML special characters
    const safeCharArbitrary = fc.string().filter(s => !/[&<>"']/.test(s));
    
    fc.assert(
      fc.property(
        safeCharArbitrary,
        (input) => {
          const escaped = escapeHtml(input);
          return escaped === input;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle strings with mixed special and regular characters', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (input) => {
          const escaped = escapeHtml(input);
          
          // Count special chars in input
          const inputSpecialCount = (input.match(/[&<>"']/g) || []).length;
          
          // If input had special chars, output should be longer (entities are longer)
          if (inputSpecialCount > 0) {
            return escaped.length > input.length;
          }
          // If no special chars, lengths should be equal
          return escaped.length === input.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty string', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('should handle strings with only special characters', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom('&', '<', '>', '"', "'"), { minLength: 1, maxLength: 20 }),
        (chars) => {
          const input = chars.join('');
          const escaped = escapeHtml(input);
          
          // Result should not contain any raw special characters
          return !/<|>|"|'/.test(escaped) && 
                 // All & should be part of entities
                 escaped.split('&').every((part, i) => 
                   i === 0 || part.startsWith('amp;') || part.startsWith('lt;') || 
                   part.startsWith('gt;') || part.startsWith('quot;') || part.startsWith('#x27;')
                 );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle common XSS attack patterns', () => {
    const xssPatterns = [
      '<script>alert("xss")</script>',
      '"><img src=x onerror=alert(1)>',
      "javascript:alert('XSS')",
      '<div onmouseover="alert(1)">',
      "'; DROP TABLE users; --",
      '<iframe src="javascript:alert(1)">',
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...xssPatterns),
        (pattern) => {
          const escaped = escapeHtml(pattern);
          
          // Escaped output should not contain raw < or > or unescaped quotes
          return !escaped.includes('<') && 
                 !escaped.includes('>') && 
                 !escaped.includes('"') && 
                 !escaped.includes("'");
        }
      ),
      { numRuns: 100 }
    );
  });
});
