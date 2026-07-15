/**
 * Meta WhatsApp Cloud API webhook.
 *
 *   GET  → one-time handshake when you register the callback URL in Meta.
 *   POST → inbound patient messages.
 */

import { NextRequest } from "next/server";
import { generateReply } from "@/lib/claude";
import { alreadyHandled, appendTurns, getTurns } from "@/lib/conversations";
import { markRead, parseInbound, sendText, verifyWebhook } from "@/lib/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** A tool-using turn can take a while; don't let the platform cut it short. */
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const challenge = verifyWebhook(req.nextUrl.searchParams);
  if (challenge === null) {
    return new Response("Forbidden", { status: 403 });
  }
  // Meta expects the raw challenge string echoed back.
  return new Response(challenge, { status: 200 });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: true }); // never make Meta retry a malformed body
  }

  const messages = parseInbound(body);

  for (const msg of messages) {
    // Meta re-delivers if we're slow. Without this the patient gets the same
    // answer two or three times.
    if (alreadyHandled(msg.messageId)) continue;

    try {
      await markRead(msg.messageId).catch(() => {}); // cosmetic; never block on it

      const reply = await generateReply({
        phone: msg.from,
        text: msg.text,
        profileName: msg.profileName,
        history: getTurns(msg.from),
      });

      await sendText(msg.from, reply);

      appendTurns(
        msg.from,
        { role: "user", content: msg.text },
        { role: "assistant", content: reply },
      );
    } catch (err) {
      console.error("[whatsapp] failed to handle message", msg.messageId, err);
      await sendText(
        msg.from,
        "Sorry — I hit a technical problem. Please call the clinic on +965 2264 9292 and we'll help you right away.",
      ).catch(() => {});
    }
  }

  // Always 200: a non-2xx makes Meta retry, and after ~20 failures it disables
  // the webhook entirely.
  return Response.json({ ok: true });
}
