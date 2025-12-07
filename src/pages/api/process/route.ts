// src/app/api/process/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
const HF_SPACE_URL = process.env.HF_SPACE_URL || "https://hf.space/embed/scizonai/hf_api-ref-scizonai";

async function tryGet(url: string) {
  try {
    const res = await fetch(url);
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await res.json();
      return { ok: res.ok, status: res.status, body: json };
    } else {
      const text = await res.text();
      return { ok: res.ok, status: res.status, body: { raw: text } };
    }
  } catch (err: any) {
    return { ok: false, status: 0, error: err.message || String(err) };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const jobId = body?.jobId;
    if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });

    // candidate URLs that your HF space server may expose for status
    const candidates = [
      `${HF_SPACE_URL.replace(/\/$/, "")}/status?id=${encodeURIComponent(jobId)}`,
      `${HF_SPACE_URL.replace(/\/$/, "")}/status/${encodeURIComponent(jobId)}`,
      `${HF_SPACE_URL.replace(/\/$/, "")}/api/status?id=${encodeURIComponent(jobId)}`,
      `${HF_SPACE_URL.replace(/\/$/, "")}/api/status/${encodeURIComponent(jobId)}`,
    ];

    for (const c of candidates) {
      const r = await tryGet(c);
      if (r.ok) {
        return NextResponse.json({ ok: true, endpoint: c, status: r.body });
      }
    }

    return NextResponse.json({ ok: false, message: "No status endpoint responded", tried: candidates }, { status: 502 });
  } catch (err: any) {
    console.error("process error", err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
