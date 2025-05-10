import { supabase } from '../supabase';
import { AES, enc } from 'crypto-js';
import { z } from 'zod';

// Validation schemas
const emailSchema = z.string().email('Invalid email format');
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

interface AuthError {
  message: string;
  code?: string;
}

class AuthService {
  private static instance: AuthService;
  private readonly SESSION_KEY = 'app_session';
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  private loginAttempts: Map<string, { count: number; timestamp: number }> = new Map();

  private constructor() {
    // Initialize session check
    this.initializeSession();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private async initializeSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      // Set up session refresh
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          localStorage.removeItem(this.SESSION_KEY);
        } else if (session) {
          localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        }
      });
    }
  }

  private validateEmail(email: string): void {
    emailSchema.parse(email);
  }

  private validatePassword(password: string): void {
    passwordSchema.parse(password);
  }

  private isUserLocked(email: string): boolean {
    const attempts = this.loginAttempts.get(email);
    if (!attempts) return false;

    const isLocked = attempts.count >= this.MAX_LOGIN_ATTEMPTS &&
      Date.now() - attempts.timestamp < this.LOCKOUT_DURATION;

    if (!isLocked && attempts.count >= this.MAX_LOGIN_ATTEMPTS) {
      this.loginAttempts.delete(email);
    }

    return isLocked;
  }

  private incrementLoginAttempts(email: string): void {
    const attempts = this.loginAttempts.get(email) || { count: 0, timestamp: Date.now() };
    attempts.count++;
    attempts.timestamp = Date.now();
    this.loginAttempts.set(email, attempts);
  }

  private async logSecurityEvent(
    userId: string,
    eventType: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('log_security_event', {
        p_user_id: userId,
        p_event_type: eventType,
        p_ip_address: await this.getClientIP(),
        p_user_agent: navigator.userAgent,
        p_metadata: metadata
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  private encryptSensitiveData(data: string): string {
    return AES.encrypt(data, process.env.VITE_ENCRYPTION_KEY || '').toString();
  }

  private decryptSensitiveData(encryptedData: string): string {
    const bytes = AES.decrypt(encryptedData, process.env.VITE_ENCRYPTION_KEY || '');
    return bytes.toString(enc.Utf8);
  }

  public async signUp(email: string, password: string): Promise<void> {
    try {
      this.validateEmail(email);
      this.validatePassword(password);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;

      if (data.user) {
        await this.logSecurityEvent(
          data.user.id,
          'signup',
          { email: this.encryptSensitiveData(email) }
        );
      }
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  public async signIn(email: string, password: string): Promise<void> {
    try {
      if (this.isUserLocked(email)) {
        throw new Error('Account temporarily locked. Please try again later.');
      }

      this.validateEmail(email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        this.incrementLoginAttempts(email);
        throw error;
      }

      if (data.user) {
        this.loginAttempts.delete(email);
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(data.session));
        await this.logSecurityEvent(
          data.user.id,
          'login_success',
          { email: this.encryptSensitiveData(email) }
        );
      }
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  public async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      localStorage.removeItem(this.SESSION_KEY);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  public async resetPassword(email: string): Promise<void> {
    try {
      this.validateEmail(email);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) throw error;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  public async updatePassword(newPassword: string): Promise<void> {
    try {
      this.validatePassword(newPassword);

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      const user = await this.getCurrentUser();
      if (user) {
        await this.logSecurityEvent(user.id, 'password_update');
      }
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  public async getCurrentUser() {
    try {
      // First check local session
      const sessionStr = localStorage.getItem(this.SESSION_KEY);
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          if (session?.user) {
            return session.user;
          }
        } catch (e) {
          localStorage.removeItem(this.SESSION_KEY);
        }
      }

      // If no local session, check with Supabase
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        if (error.message === 'Auth session missing!') {
          return null;
        }
        throw error;
      }
      
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  private handleAuthError(error: any): AuthError {
    console.error('Auth error:', error);

    // Map Supabase error codes to user-friendly messages
    const errorMap: Record<string, string> = {
      'auth/invalid-email': 'Invalid email address',
      'auth/user-disabled': 'Account has been disabled',
      'auth/user-not-found': 'Invalid email or password',
      'auth/wrong-password': 'Invalid email or password',
      'auth/email-already-in-use': 'Email already in use',
      'auth/weak-password': 'Password is too weak',
      'auth/invalid-login-credentials': 'Invalid email or password'
    };

    return {
      message: errorMap[error.code] || error.message || 'An error occurred',
      code: error.code
    };
  }
}

export const authService = AuthService.getInstance();