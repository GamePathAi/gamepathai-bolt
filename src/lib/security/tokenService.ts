import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  email: string;
  role?: string;
  [key: string]: any;
}

class TokenService {
  private static instance: TokenService;
  private readonly SECRET_KEY: string;
  private readonly TOKEN_EXPIRY: string = '1h';
  private readonly REFRESH_TOKEN_EXPIRY: string = '7d';

  private constructor() {
    this.SECRET_KEY = import.meta.env.VITE_JWT_SECRET || 'your-secret-key';
  }

  public static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }

  public generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.SECRET_KEY, { expiresIn: this.TOKEN_EXPIRY });
  }

  public generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.SECRET_KEY, { expiresIn: this.REFRESH_TOKEN_EXPIRY });
  }

  public verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, this.SECRET_KEY) as TokenPayload;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  public decodeToken(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload;
    } catch (error) {
      console.error('Token decoding failed:', error);
      return null;
    }
  }

  public isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded) return true;

    const currentTime = Date.now() / 1000;
    return decoded.exp ? decoded.exp < currentTime : true;
  }

  public refreshToken(refreshToken: string): { token: string; refreshToken: string } | null {
    try {
      const payload = this.verifyToken(refreshToken);
      if (!payload) return null;

      const newToken = this.generateToken(payload);
      const newRefreshToken = this.generateRefreshToken(payload);

      return {
        token: newToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }
}

export const tokenService = TokenService.getInstance();