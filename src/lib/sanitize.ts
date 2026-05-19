const HTML_TAGS = /<[^>]*>/g;
const DANGEROUS = /javascript:|on\w+\s*=|data:/gi;

export function sanitizeText(input: string, maxLength = 2000): string {
  return input
    .replace(HTML_TAGS, "")
    .replace(DANGEROUS, "")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeMessage(input: string): string {
  return sanitizeText(input, 2000);
}

export function sanitizeField(input: string): string {
  return sanitizeText(input, 300);
}
