// Fulfillment-mode exclusivity utilities
// Enforces that fulfillment mode is exactly one of "pickup", "delivery", or "dine_in".
// Helps detect conflicts, perform safe mode switches, and build disambiguation prompts.

export type FulfillmentMode = "pickup" | "delivery" | "dine_in";

export interface OrderStateLike {
  mode?: FulfillmentMode | null;
  pickup?: Record<string, unknown> | null;
  delivery?: Record<string, unknown> | null;
  dineIn?: Record<string, unknown> | null;
  // Additional order fields are allowed but not required here
  [key: string]: unknown;
}

/** Returns which fulfillment sections appear present (non-null and with at least one key). */
export function detectPresentModes(state: OrderStateLike): FulfillmentMode[] {
  const modes: FulfillmentMode[] = [];
  if (state.pickup && Object.keys(state.pickup).length > 0)
    modes.push("pickup");
  if (state.delivery && Object.keys(state.delivery).length > 0)
    modes.push("delivery");
  if (state.dineIn && Object.keys(state.dineIn).length > 0)
    modes.push("dine_in");
  return modes;
}

/** True if more than one fulfillment section is populated. */
export function hasConflictingModes(state: OrderStateLike): boolean {
  return detectPresentModes(state).length > 1;
}

export interface ValidationResult {
  ok: boolean;
  reason?: "ambiguous" | "conflict" | "missing";
  message?: string;
}

/**
 * Validates exclusive fulfillment mode.
 * - ok=false, reason="missing" if no mode determined
 * - ok=false, reason="ambiguous" if user referenced multiple modes without choosing
 * - ok=false, reason="conflict" if state contains conflicting fields for multiple modes
 */
export function validateExclusiveMode(state: OrderStateLike): ValidationResult {
  const present = detectPresentModes(state);
  if (present.length === 0 && !state.mode) {
    return {
      ok: false,
      reason: "missing",
      message: disambiguationMessage(),
    };
  }
  if (present.length > 1) {
    return {
      ok: false,
      reason: "ambiguous",
      message: disambiguationMessage(),
    };
  }
  if (state.mode && present.length === 1 && state.mode !== present[0]) {
    return {
      ok: false,
      reason: "conflict",
      message:
        "Your request mixes different fulfillment modes. Please choose pickup or delivery before we proceed.",
    };
  }
  return { ok: true };
}

/** Clears fields for modes other than the selected one; sets state.mode. */
export function switchMode(
  state: OrderStateLike,
  mode: FulfillmentMode
): OrderStateLike {
  const next: OrderStateLike = { ...state, mode };
  if (mode !== "pickup") next.pickup = null;
  if (mode !== "delivery") next.delivery = null;
  if (mode !== "dine_in") next.dineIn = null;
  return next;
}

/** Nulls out any conflicting mode sections while preserving current mode. */
export function clearConflictingModeFields(
  state: OrderStateLike
): OrderStateLike {
  const present = detectPresentModes(state);
  if (present.length <= 1) return state;
  const chosen: FulfillmentMode | null = state.mode ?? null;
  if (chosen) return switchMode(state, chosen);
  // If no explicit mode, keep the first detected and clear the rest
  const keep = present[0];
  return switchMode(state, keep);
}

/** Short, user-friendly disambiguation prompt. */
export function disambiguationMessage(): string {
  return "Would you like pickup, delivery, or dine-in? Please choose one so we can proceed.";
}

/**
 * Example usage:
 *
 * const result = validateExclusiveMode(orderState);
 * if (!result.ok) {
 *   // Ask user to choose one mode or resolve conflict
 *   return { status: 400, message: result.message };
 * }
 * // If user switches modes based on reply:
 * const updated = switchMode(orderState, "pickup");
 * // Optionally ensure conflicting fields are cleared defensively:
 * const sanitized = clearConflictingModeFields(updated);
 */
