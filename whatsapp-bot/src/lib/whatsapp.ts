/**
 * Meta WhatsApp Cloud API transport.
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

const GRAPH_VERSION = "v21.0";

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}. See .env.example`);
  return v;
}

/** Inbound text message, normalized from Meta's webhook payload. */
export interface InboundMessage {
  messageId: string;
  /** E.164 without '+', e.g. "96522649292" — Meta's format. */
  from: string;
  profileName?: string;
  text: string;
}

/**
 * Meta's webhook payload is deeply nested and also carries delivery-status
 * callbacks we don't care about. Returns [] for anything that isn't inbound text.
 */
export function parseInbound(body: unknown): InboundMessage[] {
  const out: InboundMessage[] = [];
  const entries = (body as any)?.entry;
  if (!Array.isArray(entries)) return out;

  for (const entry of entries) {
    for (const change of entry?.changes ?? []) {
      const value = change?.value;
      const contacts = value?.contacts ?? [];
      for (const msg of value?.messages ?? []) {
        if (msg?.type !== "text" || !msg?.text?.body) continue;
        const contact = contacts.find((c: any) => c?.wa_id === msg.from);
        out.push({
          messageId: msg.id,
          from: msg.from,
          profileName: contact?.profile?.name,
          text: msg.text.body,
        });
      }
    }
  }
  return out;
}

async function graph(path: string, payload: unknown): Promise<void> {
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env("WHATSAPP_ACCESS_TOKEN")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "<no body>");
    throw new Error(`WhatsApp API ${res.status}: ${detail}`);
  }
}

export async function sendText(to: string, body: string): Promise<void> {
  // WhatsApp hard-caps text bodies at 4096 chars.
  const text = body.length > 4096 ? `${body.slice(0, 4093)}...` : body;
  await graph(`${env("WHATSAPP_PHONE_NUMBER_ID")}/messages`, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: { preview_url: false, body: text },
  });
}

/** Blue ticks in the patient's chat — makes the bot feel alive while it thinks. */
export async function markRead(messageId: string): Promise<void> {
  await graph(`${env("WHATSAPP_PHONE_NUMBER_ID")}/messages`, {
    messaging_product: "whatsapp",
    status: "read",
    message_id: messageId,
  });
}

/** Meta's webhook handshake (GET). Returns the challenge to echo, or null to 403. */
export function verifyWebhook(params: URLSearchParams): string | null {
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");
  if (mode === "subscribe" && token === env("WHATSAPP_VERIFY_TOKEN") && challenge) return challenge;
  return null;
}
