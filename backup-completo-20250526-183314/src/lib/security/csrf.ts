import { z } from 'zod';

export const csrfTokenSchema = z.string().min(32);

export class CSRFProtection {
  private static instance: CSRFProtection;
  private token: string | null = null;

  private constructor() {
    this.generateToken();
  }

  public static getInstance(): CSRFProtection {
    if (!CSRFProtection.instance) {
      CSRFProtection.instance = new CSRFProtection();
    }
    return CSRFProtection.instance;
  }

  private generateToken(): void {
    const buffer = new Uint8Array(32);
    crypto.getRandomValues(buffer);
    this.token = Array.from(buffer)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  public getToken(): string {
    if (!this.token) {
      this.generateToken();
    }
    return this.token!;
  }

  public validateToken(token: string): boolean {
    try {
      csrfTokenSchema.parse(token);
      return token === this.token;
    } catch {
      return false;
    }
  }
}

export const csrfProtection = CSRFProtection.getInstance();