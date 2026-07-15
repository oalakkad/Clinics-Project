/**
 * Per-patient conversation memory.
 *
 * Same Phase 1.5 caveat as booking.ts: this is module memory and only survives
 * while the serverless instance stays warm. Phase 2 moves it to Supabase.
 */

import type Anthropic from "@anthropic-ai/sdk";

type Turn = Anthropic.Beta.Messages.BetaMessageParam;

interface Conversation {
  turns: Turn[];
  updatedAt: number;
}

const conversations = new Map<string, Conversation>();

/** Drop a conversation after 6h of silence — a new patient message starts fresh. */
const TTL_MS = 6 * 60 * 60 * 1000;
/** Keep the last N turns so context (and cost) stay bounded. */
const MAX_TURNS = 20;

function prune(): void {
  const cutoff = Date.now() - TTL_MS;
  for (const [phone, c] of conversations) {
    if (c.updatedAt < cutoff) conversations.delete(phone);
  }
}

export function getTurns(phone: string): Turn[] {
  prune();
  return conversations.get(phone)?.turns ?? [];
}

export function appendTurns(phone: string, ...turns: Turn[]): void {
  const existing = conversations.get(phone) ?? { turns: [], updatedAt: Date.now() };
  existing.turns.push(...turns);

  // Trim from the front, but never leave a tool_result as the first turn — the
  // API rejects a history whose opening message isn't a plain user turn.
  while (existing.turns.length > MAX_TURNS) existing.turns.shift();
  while (existing.turns.length && !isPlainUserTurn(existing.turns[0])) existing.turns.shift();

  existing.updatedAt = Date.now();
  conversations.set(phone, existing);
}

function isPlainUserTurn(turn: Turn): boolean {
  if (turn.role !== "user") return false;
  if (typeof turn.content === "string") return true;
  return !turn.content.some((block) => block.type === "tool_result");
}

export function resetConversation(phone: string): void {
  conversations.delete(phone);
}

/* ---------- Inbound de-duplication ---------- */

/**
 * Meta retries a webhook if we don't 200 fast enough. Without this guard a slow
 * Claude turn produces the same reply two or three times.
 */
const seenMessageIds = new Map<string, number>();
const SEEN_TTL_MS = 10 * 60 * 1000;

export function alreadyHandled(messageId: string): boolean {
  const now = Date.now();
  for (const [id, at] of seenMessageIds) {
    if (at < now - SEEN_TTL_MS) seenMessageIds.delete(id);
  }
  if (seenMessageIds.has(messageId)) return true;
  seenMessageIds.set(messageId, now);
  return false;
}
