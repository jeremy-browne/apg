export const prerender = false;

import type { APIRoute } from "astro";
import { verifyToken } from "../../../utils/newsletterToken";
import { readEnv } from "../../../utils/env";

export const GET: APIRoute = async ({ url, redirect, locals }) => {
    const token = url.searchParams.get("token");
    const secret = readEnv(locals, "NEWSLETTER_SECRET");
    const resendApiKey = readEnv(locals, "RESEND_API_KEY");
    const audienceId = readEnv(locals, "RESEND_AUDIENCE_ID");

    if (!token || !secret || !resendApiKey || !audienceId) {
        console.error("[newsletter/confirm] missing env vars — token:", !!token, "secret:", !!secret, "apiKey:", !!resendApiKey, "audienceId:", !!audienceId);
        return redirect("/newsletter?confirmed=error");
    }

    const result = await verifyToken(token, secret);

    if (!result.ok) {
        return redirect(`/newsletter?confirmed=${result.reason}`);
    }

    const res = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({ email: result.email, unsubscribed: false }),
    });

    // 409 = contact already exists — treat as success
    if (!res.ok && res.status !== 409) {
        console.error("[resend] audience add failed:", res.status, await res.text());
        return redirect("/newsletter?confirmed=error");
    }

    return redirect("/newsletter?confirmed=1");
};
