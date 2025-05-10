import { z } from 'zod';
import DOMPurify from 'dompurify';

export class XSSProtection {
  private static instance: XSSProtection;

  private constructor() {}

  public static getInstance(): XSSProtection {
    if (!XSSProtection.instance) {
      XSSProtection.instance = new XSSProtection();
    }
    return XSSProtection.instance;
  }

  public sanitize(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
      ALLOWED_ATTR: []
    });
  }

  public validateUserInput(input: string): string {
    const schema = z.string()
      .min(1, 'Input cannot be empty')
      .max(1000, 'Input too long')
      .transform(val => this.sanitize(val));

    return schema.parse(input);
  }
}

export const xssProtection = XSSProtection.getInstance();