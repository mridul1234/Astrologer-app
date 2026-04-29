import { NextRequest, NextResponse } from "next/server";

/**
 * Gupshup Webhook Handler
 * Receives real-time message events forwarded by Gupshup from Meta/WhatsApp.
 * Gupshup forwards the raw Meta WhatsApp Business API webhook payload.
 *
 * Webhook URL (set in Gupshup Dashboard → Webhooks → Add Webhook):
 *   https://astrowalla.com/api/gupshup/webhook
 */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    let body: any = {};

    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      const text = await req.text();
      const params = new URLSearchParams(text);
      const payloadStr = params.get("payload");
      if (payloadStr) {
        try { body = JSON.parse(payloadStr); } catch { body = { raw: payloadStr }; }
      } else {
        try { body = JSON.parse(text); } catch { body = { raw: text }; }
      }
    }

    // ── Meta/WhatsApp Business API format (forwarded by Gupshup) ────────────
    if (body?.object === "whatsapp_business_account") {
      const entries: any[] = body?.entry ?? [];

      for (const entry of entries) {
        const changes: any[] = entry?.changes ?? [];

        for (const change of changes) {
          const value = change?.value ?? {};

          // Delivery status updates
          const statuses: any[] = value?.statuses ?? [];
          for (const s of statuses) {
            const status: string = s?.status ?? "unknown";
            const recipient: string = s?.recipient_id ?? "unknown";
            const msgId: string = s?.id ?? s?.gs_id ?? "unknown";
            const errors: any[] = s?.errors ?? [];

            if (status === "failed") {
              for (const err of errors) {
                const code: number = err?.code;
                const message: string = err?.message ?? "Unknown error";
                const details: string = err?.error_data?.details ?? "";
                console.error(
                  `[Gupshup Webhook] ❌ DELIVERY FAILED to ${recipient} | code: ${code} | ${message}${details ? ` | ${details}` : ""} | msgId: ${msgId}`
                );
              }
            } else {
              console.log(
                `[Gupshup Webhook] ✅ Status for ${recipient}: ${status.toUpperCase()} | msgId: ${msgId}`
              );
            }
          }

          // Inbound messages (opt-in triggers)
          const messages: any[] = value?.messages ?? [];
          for (const msg of messages) {
            const from: string = msg?.from ?? "unknown";
            const text: string = msg?.text?.body ?? "(non-text)";
            console.log(`[Gupshup Webhook] 📩 Inbound from ${from}: "${text}"`);
          }
        }
      }

      return NextResponse.json({ received: true }, { status: 200 });
    }

    // ── Legacy Gupshup format ────────────────────────────────────────────────
    const eventType: string = body?.type ?? "unknown";

    if (eventType === "message") {
      const senderPhone: string = body?.payload?.source ?? body?.payload?.sender?.phone ?? "unknown";
      const messageText: string = body?.payload?.payload?.text ?? "";
      console.log(`[Gupshup Webhook] 📩 Inbound message from ${senderPhone}: "${messageText}"`);
    } else if (eventType === "message-event") {
      const destination: string = body?.payload?.destination ?? "unknown";
      const status: string = body?.payload?.type ?? "unknown";
      const messageId: string = body?.payload?.id ?? "unknown";
      console.log(`[Gupshup Webhook] Status for ${destination}: ${status.toUpperCase()} | msgId: ${messageId}`);
    } else {
      console.log(`[Gupshup Webhook] Unhandled event:`, JSON.stringify(body).slice(0, 300));
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("[Gupshup Webhook] Error processing event:", err);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

// Gupshup/Meta sends a GET to verify the webhook URL
export async function GET() {
  return NextResponse.json({ status: "Gupshup webhook active" }, { status: 200 });
}
