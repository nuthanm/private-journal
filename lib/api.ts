import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function err(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

// Generic error to return when sign-in fails — never says which field was wrong.
export const SIGNIN_ERROR = "That combination doesn't match. Check the phone number and secret, then try again.";
