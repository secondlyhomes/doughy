// Webhook Bridge — Trust enforcement
// Checks kill switch and trust level before forwarding to OpenClaw.

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

type TrustLevel = "locked" | "manual" | "guarded" | "autonomous";

/**
 * Check if the kill switch is active.
 * Queries claw.kill_switch_log for the most recent event.
 * Fail-closed: if query fails, assumes kill switch is active.
 */
export async function isKillSwitchActive(): Promise<boolean> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/kill_switch_log?select=action&order=created_at.desc&limit=1`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          "Accept-Profile": "claw",
        },
      }
    );

    if (!response.ok) {
      console.error("[Trust] Kill switch query failed, fail-closed");
      return true;
    }

    const rows = (await response.json()) as Array<{ action: string }>;
    if (rows.length === 0) return false;
    return rows[0].action === "activate";
  } catch (error) {
    console.error("[Trust] Kill switch check error, fail-closed:", error);
    return true;
  }
}

/**
 * Get the trust level for a user.
 * Returns the configured trust level, defaulting to "manual" if not found.
 */
export async function checkTrustLevel(userId: string | undefined): Promise<TrustLevel> {
  if (!userId) return "manual";

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/trust_config?user_id=eq.${userId}&select=trust_level&limit=1`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          "Accept-Profile": "claw",
        },
      }
    );

    if (!response.ok) return "manual";

    const rows = (await response.json()) as Array<{ trust_level: string }>;
    if (rows.length === 0) return "manual";

    const level = rows[0].trust_level;
    if (["locked", "manual", "guarded", "autonomous"].includes(level)) {
      return level as TrustLevel;
    }
    return "manual";
  } catch {
    return "manual";
  }
}
