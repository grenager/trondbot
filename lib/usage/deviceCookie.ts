import type { NextRequest, NextResponse } from "next/server";
import type { RequestCookies } from "next/dist/compiled/@edge-runtime/cookies";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { getUsageHmacSecret } from "@/lib/env";
import {
  ANONYMOUS_FREE_MESSAGES,
  DEVICE_USAGE_COOKIE_NAME,
} from "@/lib/usage/constants";

export interface DeviceUsagePayload {
  deviceId: string;
  messagesUsed: number;
}

const COOKIE_MAX_AGE_SECONDS: number = 60 * 60 * 24 * 365;

type CookieStore =
  | RequestCookies
  | ReadonlyRequestCookies
  | Pick<RequestCookies, "get">;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

function encodePayload(payload: DeviceUsagePayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(encoded: string): DeviceUsagePayload | null {
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    );
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    const record = parsed as Record<string, unknown>;
    if (
      typeof record.deviceId !== "string" ||
      typeof record.messagesUsed !== "number" ||
      !Number.isFinite(record.messagesUsed) ||
      record.messagesUsed < 0
    ) {
      return null;
    }

    return {
      deviceId: record.deviceId,
      messagesUsed: Math.min(
        ANONYMOUS_FREE_MESSAGES,
        Math.max(0, Math.floor(record.messagesUsed)),
      ),
    };
  } catch {
    return null;
  }
}

async function signPayload(encoded: string): Promise<string> {
  const secret: string = getUsageHmacSecret();
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(encoded),
  );
  return bytesToHex(new Uint8Array(signature));
}

async function verifyPayload(
  encoded: string,
  signature: string,
): Promise<boolean> {
  const expected: string = await signPayload(encoded);
  if (expected.length !== signature.length) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
  }
  return mismatch === 0;
}

function createDefaultPayload(): DeviceUsagePayload {
  return {
    deviceId: crypto.randomUUID(),
    messagesUsed: 0,
  };
}

export async function parseDeviceUsageCookie(
  value: string | undefined,
): Promise<DeviceUsagePayload | null> {
  if (!value) {
    return null;
  }

  const separatorIndex: number = value.lastIndexOf(".");
  if (separatorIndex <= 0) {
    return null;
  }

  const encoded: string = value.slice(0, separatorIndex);
  const signature: string = value.slice(separatorIndex + 1);
  if (!encoded || !signature) {
    return null;
  }

  const verified: boolean = await verifyPayload(encoded, signature);
  if (!verified) {
    return null;
  }

  return decodePayload(encoded);
}

export async function serializeDeviceUsageCookie(
  payload: DeviceUsagePayload,
): Promise<string> {
  const encoded: string = encodePayload(payload);
  const signature: string = await signPayload(encoded);
  return `${encoded}.${signature}`;
}

export function getDeviceUsageCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  };
}

export async function readDeviceUsage(
  cookies: CookieStore,
): Promise<DeviceUsagePayload> {
  const existing: string | undefined = cookies.get(DEVICE_USAGE_COOKIE_NAME)?.value;
  const parsed: DeviceUsagePayload | null =
    await parseDeviceUsageCookie(existing);
  return parsed ?? createDefaultPayload();
}

export async function ensureDeviceUsageCookie(
  request: NextRequest,
  response: NextResponse,
): Promise<NextResponse> {
  const existing: string | undefined = request.cookies.get(
    DEVICE_USAGE_COOKIE_NAME,
  )?.value;
  const parsed: DeviceUsagePayload | null =
    await parseDeviceUsageCookie(existing);

  if (parsed) {
    return response;
  }

  const payload: DeviceUsagePayload = createDefaultPayload();
  const value: string = await serializeDeviceUsageCookie(payload);
  response.cookies.set(DEVICE_USAGE_COOKIE_NAME, value, getDeviceUsageCookieOptions());
  return response;
}

export async function writeDeviceUsageCookie(
  response: NextResponse,
  payload: DeviceUsagePayload,
): Promise<void> {
  const value: string = await serializeDeviceUsageCookie(payload);
  response.cookies.set(
    DEVICE_USAGE_COOKIE_NAME,
    value,
    getDeviceUsageCookieOptions(),
  );
}

export function getAnonymousRemaining(payload: DeviceUsagePayload): number {
  return Math.max(0, ANONYMOUS_FREE_MESSAGES - payload.messagesUsed);
}

export function isAnonymousQuotaExhausted(payload: DeviceUsagePayload): boolean {
  return payload.messagesUsed >= ANONYMOUS_FREE_MESSAGES;
}
