import { NextRequest, NextResponse } from "next/server";

/**
 * Gupshup Webhook Handler
 * Receives real-time message events from Gupshup:
 *  - Inbound messages  → registers opt-in for sender's number
 *  - Delivery reports  → logs actual delivery status (sent/delivered/failed)
 *
 * Add this URL in Gupshup Dashboard → Webhooks → Add Webhook:
 *   https://<your-domain>/api/gupshup/webhook
 */
export async function POST(req: NextRequest) {
  try {
    // Gupshup sends payload as application/x-www-form-urlencoded with a "payload" field
    const contentType = req.headers.get("content-type") ?? "";
    let body: any = {};

    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      // Form-encoded: payload is a JSON string inside a "payload" key
      const text = await req.text();
      const params = new URLSearchParams(text);
      const payloadStr = params.get("payload");
      if (payloadStr) {
        try {
          body = JSON.parse(payloadStr);
        } catch {
          body = { raw: payloadStr };
        }
      }
    }

    const eventType: string = body?.type ?? "unknown";

    // ── Inbound message from a user/astrologer ──────────────────────────────
    if (eventType === "message") {
      const senderPhone: string = body?.payload?.source ?? body?.payload?.sender?.phone ?? "unknown";
      const messageText: string = body?.payload?.payload?.text ?? "";
      console.log(`[Gupshup Webhook] Inbound message from ${senderPhone}: "${messageText}"`);
      // Receiving this event means the number is now opted-in — no further action needed.
      // Gupshup automatically registers opt-in when an inbound message is received.
    }

    // ── Delivery Receipt (DLR) ───────────────────────────────────────────────
    else if (eventType === "message-event") {
      const destination: string = body?.payload?.destination ?? "unknown";
      const status: string = body?.payload?.type ?? "unknown";       // sent | delivered | read | failed
      const messageId: string = body?.payload?.id ?? "unknown";
      const errorCode: string = body?.payload?.payload?.errorCode ?? "";
      const errorMessage: string = body?.payload?.payload?.errorMessage ?? "";

      if (status === "failed") {
        console.error(
          `[Gupshup Webhook] FAILED delivery to ${destination} | msgId: ${messageId} | error: ${errorCode} — ${errorMessage}`
        );
      } else {
        console.log(
          `[Gupshup Webhook] Delivery status for ${destination}: ${status.toUpperCase()} | msgId: ${messageId}`
        );
      }
    }

    // ── Unknown event type ──────────────────────────────────────────────────
    else {
      console.log(`[Gupshup Webhook] Unhandled event type: ${eventType}`, JSON.stringify(body));
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("[Gupshup Webhook] Error processing event:", err);
    // Still return 200 so Gupshup doesn't retry indefinitely
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

// Gupshup sometimes sends a GET to verify the webhook URL
export async function GET() {
  return NextResponse.json({ status: "Gupshup webhook active" }, { status: 200 });
}
