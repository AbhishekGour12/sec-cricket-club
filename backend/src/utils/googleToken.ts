import { OAuth2Client, TokenPayload } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { logger } from './logger';

const googleClient = new OAuth2Client();
const DEFAULT_WEB_CLIENT_ID =
  '837780082237-n5fr5566aibc80v5ula2ssljqivuf98t.apps.googleusercontent.com';
const DEFAULT_ANDROID_CLIENT_ID =
  '837780082237-4f8lck3si4ga74an91qfuf30185lsfof.apps.googleusercontent.com';
const DEFAULT_IOS_CLIENT_ID =
  '837780082237-gmj2oqqtv9ek1a4h1pnrnpfjvr59ktnj.apps.googleusercontent.com';

function audienceList(decodedAud?: string | string[]): string[] {
  const fromEnv = [
    process.env.GOOGLE_WEB_CLIENT_ID || DEFAULT_WEB_CLIENT_ID,
    process.env.GOOGLE_ANDROID_CLIENT_ID || DEFAULT_ANDROID_CLIENT_ID,
    process.env.GOOGLE_IOS_CLIENT_ID || DEFAULT_IOS_CLIENT_ID,
  ].filter((value): value is string => Boolean(value && value.trim()));

  const fromToken = Array.isArray(decodedAud) ? decodedAud : decodedAud ? [decodedAud] : [];
  return [...new Set([...fromEnv, ...fromToken])];
}

export interface VerifiedGoogleIdentity {
  uid: string;
  email: string;
  name: string;
  picture: string;
}

/**
 * Verifies a Google OpenID ID token via cached JWKS (google-auth-library).
 * Returns null if the token is not a Google-issued JWT.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<VerifiedGoogleIdentity | null> {
  const decoded = jwt.decode(idToken) as { iss?: string; aud?: string | string[] } | null;
  const issuer = decoded?.iss || '';
  if (!issuer.includes('accounts.google.com')) {
    return null;
  }

  const audience = audienceList(decoded?.aud);
  if (audience.length === 0) {
    logger.warn('Google ID token verification skipped: no audience configured');
    return null;
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience,
  });
  const payload: TokenPayload | undefined = ticket.getPayload();
  if (!payload?.email) {
    return null;
  }

  return {
    uid: payload.sub,
    email: payload.email,
    name: payload.name || '',
    picture: payload.picture || '',
  };
}
