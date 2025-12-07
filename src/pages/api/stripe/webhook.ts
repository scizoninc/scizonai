// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

// envs
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const HF_SPACE_URL = process.env.HF_SPACE_URL || "https://hf.space/embed/scizonai/hf_api-ref-scizonai";

let stripe: Stripe | null = null;
if (STRIPE_SECRET_KEY) stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2022-11-15" });

export async function POST(req: NextRequest) {
  try {
    const buf = await req.arrayBuffer();
    const rawBody = Buffer.from(buf);
    const sigHeader = req.headers.get("stripe-signature") || "";

    if (!STRIPE_WEBHOOK_SECRET) {
      console.warn("No STRIPE_WEBHOOK_SECRET configured - skipping signature verification");
    }

    let event: any = null;

    if (STRIPE_WEBHOOK_SECRET && stripe) {
      try {
        event = stripe.webhooks.constructEvent(rawBody, sigHeader, STRIPE_WEBHOOK_SECRET);
      } catch (err: any) {
        console.error("Stripe webhook signature verification failed:", err.message || err);
        return new NextResponse(`Webhook Error: ${err.message || String(err)}`, { status: 400 });
      }
    } else {
      // If we don't have secret, try to parse the JSON body (best-effort)
      try {
        event = JSON.parse(rawBody.toString());
      } catch (err) {
        console.error("Failed to parse webhook body", err);
        return new NextResponse("Bad request", { status: 400 });
      }
    }

    // handle event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const jobId = session?.metadata?.jobId || session?.metadata?.job_id || null;
      console.log("Stripe session completed for jobId:", jobId);

      // Try to forward the raw webhook to HF Space endpoint that handles Stripe webhooks
      const hfCandidates = [
        `${HF_SPACE_URL.replace(/\/$/, "")}/stripe/webhook`,
        `${HF_SPACE_URL.replace(/\/$/, "")}/api/stripe/webhook`,
        `${HF_SPACE_URL.replace(/\/$/, "")}/api/mark-paid`,
        `${HF_SPACE_URL.replace(/\/$/, "")}/mark-paid`,
      ];

      const jsonPayload = event; // event is already parsed

      for (const endpoint of hfCandidates) {
        try {
          const hfResp = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(jsonPayload),
          });
          if (hfResp.ok) {
            console.log("Forwarded webhook to HF space:", endpoint);
            return NextResponse.json({ ok: true, forwardedTo: endpoint });
          }
          // if hfResp not ok, continue trying other endpoints
        } catch (err: any) {
          console.warn("Error forwarding to", endpoint, err.message || err);
        }
      }

      // fallback: if none accepted, but we have jobId, call mark-paid minimal endpoint
      if (jobId) {
        const fallback = `${HF_SPACE_URL.replace(/\/$/, "")}/api/mark-paid`;
        try {
          const r2 = await fetch(fallback, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jobId }),
          });
          if (r2.ok) {
            console.log("Marked paid via fallback mark-paid endpoint");
            return NextResponse.json({ ok: true, markedVia: fallback });
          }
        } catch (err: any) {
          console.warn("Fallback mark-paid failed", err.message || err);
        }
      }

      // nothing worked
      return NextResponse.json({ ok: false, message: "Webhook received, but could not forward to HF Space. Check HF endpoints." }, { status: 502 });
    }

    // other events: just ack
    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("stripe webhook handler error", err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
