import { compare, hash } from "bcryptjs";
import { cookies } from "next/headers";
import { type NextRequest } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { AuthProvider, Role, SubscriptionTier } from "@prisma/client";
import { recordAuditEvent } from "@/lib/observability";
import { getPrismaClient, requirePrismaClient } from "./prisma";

export type SessionUser = {
  id: string;
  email: string;
  name?: string;
  role: Role;
  subscriptionTier: SubscriptionTier;
  locale: string;
  authProvider: AuthProvider;
  isAnonymous: boolean;
  marketingConsent: boolean;
};

const SESSION_COOKIE_NAME = "spegeln_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const POLICY_VERSION = "2026-03";

type SessionPayload = {
  sub: string;
  email: string;
  name?: string;
  role: Role;
  subscriptionTier: SubscriptionTier;
  locale: string;
  authProvider: AuthProvider;
  isAnonymous: boolean;
  marketingConsent: boolean;
};

function getSessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET || process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SESSION_SECRET eller NEXTAUTH_SECRET måste vara satt för sessionssignering.");
  }

  return new TextEncoder().encode(secret);
}

function serializeSessionUser(user: SessionUser): SessionPayload {
  return {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    subscriptionTier: user.subscriptionTier,
    locale: user.locale,
    authProvider: user.authProvider,
    isAnonymous: user.isAnonymous,
    marketingConsent: user.marketingConsent,
  };
}

function fromSessionPayload(payload: SessionPayload): SessionUser {
  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    subscriptionTier: payload.subscriptionTier,
    locale: payload.locale,
    authProvider: payload.authProvider,
    isAnonymous: payload.isAnonymous,
    marketingConsent: payload.marketingConsent,
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function guestEmail() {
  return `guest+${crypto.randomUUID()}@guest.spegeln.local`;
}

function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

async function signSession(user: SessionUser) {
  return new SignJWT(serializeSessionUser(user))
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSessionSecret());
}

async function decodeSession(token: string) {
  try {
    const verified = await jwtVerify<SessionPayload>(token, getSessionSecret());

    return fromSessionPayload(verified.payload);
  } catch {
    return null;
  }
}

function toSessionUser(user: {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  subscriptionTier: SubscriptionTier;
  locale: string | null;
  authProvider: AuthProvider;
  isAnonymous: boolean;
  marketingConsent: boolean;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name || undefined,
    role: user.role,
    subscriptionTier: user.subscriptionTier,
    locale: user.locale || "sv-SE",
    authProvider: user.authProvider,
    isAnonymous: user.isAnonymous,
    marketingConsent: user.marketingConsent,
  } satisfies SessionUser;
}

export function getPolicyVersion() {
  return POLICY_VERSION;
}

export async function persistSession(user: SessionUser) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, await signSession(user), sessionCookieOptions());
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
  });
}

export async function getSessionUserFromRequest(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return decodeSession(token);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!cookie) return null;

  const sessionUser = await decodeSession(cookie.value);

  if (!sessionUser) {
    return null;
  }

  const prisma = getPrismaClient();

  if (!prisma) {
    return sessionUser;
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      subscriptionTier: true,
      locale: true,
      authProvider: true,
      isAnonymous: true,
      marketingConsent: true,
    },
  });

  if (!user) {
    return sessionUser.isAnonymous ? sessionUser : null;
  }

  return toSessionUser(user);
}

export function requireRole(user: SessionUser | null, allowed: Role[]): boolean {
  if (!user) return false;
  return allowed.includes(user.role);
}

export async function registerEmailUser(input: {
  email: string;
  password: string;
  name?: string;
  preferredLanguage?: string;
  marketingConsent?: boolean;
}) {
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new Error("DATABASE_URL saknas. Registrering kräver databaspersistens.");
  }

  const email = normalizeEmail(input.email);
  const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });

  if (existingUser) {
    throw new Error("Det finns redan ett konto med den e-postadressen.");
  }

  const passwordHash = await hash(input.password, 12);
  const locale = input.preferredLanguage === "en" ? "en-GB" : "sv-SE";
  const createdUser = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: input.name?.trim() || null,
      authProvider: "EMAIL",
      preferredLanguage: input.preferredLanguage === "en" ? "en" : "sv",
      locale,
      privacyConsentAt: new Date(),
      termsAcceptedAt: new Date(),
      marketingConsent: Boolean(input.marketingConsent),
      consentEvents: {
        create: {
          policyVersion: POLICY_VERSION,
          locale,
          acceptedTerms: true,
          acceptedPrivacy: true,
          marketingConsent: Boolean(input.marketingConsent),
          analyticsConsent: true,
        },
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      subscriptionTier: true,
      locale: true,
      authProvider: true,
      isAnonymous: true,
      marketingConsent: true,
    },
  });

  await recordAuditEvent({
    userId: createdUser.id,
    actorLabel: email,
    action: "auth.register",
    targetType: "User",
    targetId: createdUser.id,
    metadata: { authProvider: "EMAIL" },
  });

  return toSessionUser(createdUser);
}

export async function authenticateEmailUser(input: { email: string; password: string }) {
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new Error("DATABASE_URL saknas. Inloggning kräver databaspersistens.");
  }

  const email = normalizeEmail(input.email);
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      subscriptionTier: true,
      locale: true,
      authProvider: true,
      isAnonymous: true,
      marketingConsent: true,
      passwordHash: true,
    },
  });

  if (!user?.passwordHash) {
    throw new Error("Ogiltiga inloggningsuppgifter.");
  }

  const passwordMatches = await compare(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new Error("Ogiltiga inloggningsuppgifter.");
  }

  return toSessionUser(user);
}

export async function upsertSocialUser(input: {
  email: string;
  name?: string;
  provider: AuthProvider;
}) {
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new Error("DATABASE_URL saknas. Social inloggning kräver databaspersistens.");
  }

  const email = normalizeEmail(input.email);
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: input.name?.trim() || undefined,
      authProvider: input.provider,
      emailVerifiedAt: new Date(),
    },
    create: {
      email,
      name: input.name?.trim() || null,
      authProvider: input.provider,
      emailVerifiedAt: new Date(),
      privacyConsentAt: new Date(),
      termsAcceptedAt: new Date(),
      consentEvents: {
        create: {
          policyVersion: POLICY_VERSION,
          acceptedTerms: true,
          acceptedPrivacy: true,
          analyticsConsent: true,
        },
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      subscriptionTier: true,
      locale: true,
      authProvider: true,
      isAnonymous: true,
      marketingConsent: true,
    },
  });

  await recordAuditEvent({
    userId: user.id,
    actorLabel: email,
    action: "auth.social",
    targetType: "User",
    targetId: user.id,
    metadata: { authProvider: input.provider },
  });

  return toSessionUser(user);
}

export async function createAnonymousUser(preferredLanguage = "sv") {
  const locale = preferredLanguage === "en" ? "en-GB" : "sv-SE";
  const prisma = requirePrismaClient("DATABASE_URL saknas. Anonymt konto kräver databaspersistens.");

  const user = await prisma.user.create({
    data: {
      email: guestEmail(),
      name: "Guest",
      authProvider: "ANONYMOUS",
      isAnonymous: true,
      preferredLanguage: preferredLanguage === "en" ? "en" : "sv",
      locale,
      privacyConsentAt: new Date(),
      termsAcceptedAt: new Date(),
      consentEvents: {
        create: {
          policyVersion: POLICY_VERSION,
          locale,
          acceptedTerms: true,
          acceptedPrivacy: true,
          analyticsConsent: true,
        },
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      subscriptionTier: true,
      locale: true,
      authProvider: true,
      isAnonymous: true,
      marketingConsent: true,
    },
  });

  return toSessionUser(user);
}
