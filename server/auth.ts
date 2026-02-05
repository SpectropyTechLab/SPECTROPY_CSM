import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

const COOKIE_NAME = "spectropy_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const TOKEN_ISSUER = "spectropy-crm";
const TOKEN_AUDIENCE = "spectropy-client";
const DEV_FALLBACK_SECRET = "dev-insecure-secret-change-me";

type SessionPayload = {
  userId: number;
};

declare global {
  namespace Express {
    interface Request {
      authUserId?: number;
    }
  }
}

function getJwtSecret(): string {
  const secret = process.env.AUTH_JWT_SECRET;
  if (process.env.NODE_ENV === "production") {
    if (!secret) {
      throw new Error("AUTH_JWT_SECRET is required in production");
    }
    return secret;
  }

  return secret ?? DEV_FALLBACK_SECRET;
}

function parseCookieHeader(header: string | undefined): Record<string, string> {
  if (!header) return {};

  return header.split(";").reduce<Record<string, string>>((acc, part) => {
    const [rawKey, ...rawValue] = part.split("=");
    if (!rawKey) return acc;
    const key = rawKey.trim();
    if (!key) return acc;
    const value = rawValue.join("=").trim();
    if (value) {
      acc[key] = decodeURIComponent(value);
    }
    return acc;
  }, {});
}

function getCookieValue(req: Request, name: string): string | null {
  const cookies = parseCookieHeader(req.headers.cookie);
  return cookies[name] ?? null;
}

export function createSessionToken(userId: number): string {
  const payload: SessionPayload = { userId };
  return jwt.sign(payload, getJwtSecret(), {
    algorithm: "HS256",
    expiresIn: SESSION_TTL_SECONDS,
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE,
  });
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS256"],
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    });

    if (typeof decoded === "string") {
      return null;
    }

    const payload = decoded as JwtPayload & SessionPayload;
    if (!payload.userId || typeof payload.userId !== "number") {
      return null;
    }

    return { userId: payload.userId };
  } catch {
    return null;
  }
}

export function issueSessionCookie(res: Response, userId: number) {
  const token = createSessionToken(userId);
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS * 1000,
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.method === "OPTIONS") {
    return next();
  }

  if (req.originalUrl.startsWith("/api/auth")) {
    return next();
  }

  const token = getCookieValue(req, COOKIE_NAME);
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const payload = verifySessionToken(token);
  if (!payload) {
    return res.status(401).json({ message: "Invalid or expired session" });
  }

  req.authUserId = payload.userId;
  return next();
}

export function getCurrentUserId(req: Request): number {
  if (!req.authUserId) {
    throw new Error("Authentication required");
  }
  return req.authUserId;
}
