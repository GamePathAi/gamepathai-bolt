import { z } from 'zod';
import DOMPurify from 'dompurify';

export class XSSProtection {
  private static instance: XSSProtection;

  private constructor() {
    // Configure DOMPurify
    DOMPurify.setConfig({
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span', 'p'],
      ALLOWED_ATTR: ['class', 'data-*'],
      KEEP_CONTENT: true,
      RETURN_DOM: false,
      SANITIZE_DOM: true
    });

    // Add custom hooks
    DOMPurify.addHook('beforeSanitizeElements', (node) => {
      if (node.nodeName === 'SCRIPT') {
        return null;
      }
      return node;
    });
  }

  public static getInstance(): XSSProtection {
    if (!XSSProtection.instance) {
      XSSProtection.instance = new XSSProtection();
    }
    return XSSProtection.instance;
  }

  public validateUserInput(input: string): string {
    const schema = z.string()
      .min(1, 'Input cannot be empty')
      .max(1000, 'Input too long')
      .regex(/^[a-zA-Z0-9\s\-_.,!?@]*$/, 'Invalid characters detected')
      .transform(val => this.sanitize(val));

    return schema.parse(input);
  }

  public sanitize(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    // Pre-sanitization replacements
    const preProcessed = input
      .replace(/javascript:/gi, '')
      .replace(/data:/gi, '')
      .replace(/vbscript:/gi, '');

    // Apply DOMPurify sanitization
    const sanitized = DOMPurify.sanitize(preProcessed, {
      SANITIZE_DOM: true,
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span', 'p'],
      ALLOWED_ATTR: ['class', 'data-*']
    });

    // Post-sanitization validation
    return this.validateSanitizedOutput(sanitized);
  }

  private validateSanitizedOutput(output: string): string {
    // Additional validation checks
    if (/<[^>]+>/g.test(output)) {
      // If HTML tags are found after sanitization, strip them completely
      return output.replace(/<[^>]+>/g, '');
    }
    return output;
  }

  public sanitizeURL(url: string): string {
    const urlSchema = z.string().url().transform(val => {
      const parsed = new URL(val);
      return parsed.toString();
    });

    try {
      return urlSchema.parse(url);
    } catch {
      return '';
    }
  }

  public sanitizeHTML(html: string, options?: {
    allowedTags?: string[];
    allowedAttrs?: string[];
  }): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: options?.allowedTags || ['b', 'i', 'em', 'strong', 'span', 'p'],
      ALLOWED_ATTR: options?.allowedAttrs || ['class', 'data-*'],
      SANITIZE_DOM: true
    });
  }
}

export const xssProtection = XSSProtection.getInstance();