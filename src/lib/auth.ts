// import jwt from "jsonwebtoken";

// export function signToken(payload: any) {
//   return jwt.sign(payload, process.env.JWT_SECRET!, {
//     expiresIn: "15m",
//   });
// }

// export function signRefreshToken(payload: any) {
//   return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
//     expiresIn: "7d",
//   });
// }

// export function verifyToken(token: string) {
//   return jwt.verify(token, process.env.JWT_SECRET!);
// }

// export function verifyRefreshToken(token: string) {
//   return jwt.verify(token, process.env.JWT_REFRESH_SECRET!);
// }
import jwt, { JwtPayload } from "jsonwebtoken";

export interface AuthTokenPayload extends JwtPayload {
  id: string;
  email: string;
}

/**
 * Create short-lived Access Token (15 minutes)
 */
export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: "15m",
  });
}

/**
 * Create long-lived Refresh Token (7 days)
 */
export function signRefreshToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: "7d",
  });
}

/**
 * Verify Access Token
 */
export function verifyToken(token: string): AuthTokenPayload {
  return jwt.verify(token, process.env.JWT_SECRET as string) as AuthTokenPayload;
}

/**
 * Verify Refresh Token
 */
export function verifyRefreshToken(token: string): AuthTokenPayload {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as AuthTokenPayload;
}
