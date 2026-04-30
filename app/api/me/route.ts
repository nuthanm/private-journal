import { getCurrentAccount, refreshSession, getIdleTimeoutSeconds } from "@/lib/auth";
import { ok, err } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const account = await getCurrentAccount();
  if (!account) {
    return err("Not authenticated", 401);
  }

  // Refresh the session cookie — every authenticated request bumps the timer
  await refreshSession(account.id);

  return ok({
    account: {
      id: account.id,
      created_at: account.created_at,
      last_signin_at: account.last_signin_at,
    },
    idleTimeoutSeconds: getIdleTimeoutSeconds(),
  });
}
