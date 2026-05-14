import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";
import { createToken } from "../utils/newsletterToken";

async function verifyTurnstile(token: string, secret: string): Promise<boolean> {
    const res = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ secret, response: token }),
        },
    );
    const data = (await res.json()) as { success: boolean; "error-codes"?: string[] };
    if (!data.success) {
        console.error("[turnstile] verification failed:", data["error-codes"]);
    }
    return data.success;
}

async function sendResendEmail(opts: {
    apiKey: string;
    to: string;
    from: string;
    replyTo: string;
    subject: string;
    html: string;
}): Promise<void> {
    const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${opts.apiKey}`,
        },
        body: JSON.stringify({
            from: opts.from,
            to: [opts.to],
            reply_to: opts.replyTo,
            subject: opts.subject,
            html: opts.html,
        }),
    });

    if (!res.ok) {
        const body = await res.text();
        console.error(`[resend] API error ${res.status}:`, body);
        throw new Error(`Resend API error ${res.status}: ${body}`);
    }
}


export const server = {
    contact: defineAction({
        accept: "form",
        input: z.object({
            name: z.string().min(1).max(100),
            email: z.string().email().max(254),
            message: z.string().min(1).max(5000),
            "cf-turnstile-response": z.string().optional(),
        }),
        handler: async (input) => {
            const turnstileSecret = import.meta.env.TURNSTILE_SECRET_KEY;
            const resendApiKey = import.meta.env.RESEND_API_KEY;

            if (turnstileSecret) {
                const token = input["cf-turnstile-response"];
                if (!token) {
                    throw new ActionError({
                        code: "BAD_REQUEST",
                        message: "Turnstile verification failed.",
                    });
                }
                let valid: boolean;
                try {
                    valid = await verifyTurnstile(token, turnstileSecret);
                } catch (err) {
                    console.error("[turnstile] fetch error:", err);
                    throw new ActionError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Could not verify request. Please try again.",
                    });
                }
                if (!valid) {
                    throw new ActionError({
                        code: "BAD_REQUEST",
                        message: "Turnstile verification failed.",
                    });
                }
            }

            if (!resendApiKey) {
                console.error("[resend] RESEND_API_KEY is not set");
                throw new ActionError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Email not configured.",
                });
            }

            try {
                await sendResendEmail({
                    apiKey: resendApiKey,
                    to: "jeremybrowne1991@gmail.com",
                    from: "Aussie Pilot Guide <onboarding@resend.dev>",
                    replyTo: input.email,
                    subject: `New message from ${input.name}`,
                    html: `<p><strong>Name:</strong> ${input.name}</p><p><strong>Email:</strong> ${input.email}</p><p><strong>Message:</strong></p><p>${input.message.replace(/\n/g, "<br>")}</p>`,
                });
            } catch (err) {
                const detail = err instanceof Error ? err.message : String(err);
                console.error("[resend] send failed:", detail);
                throw new ActionError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Could not send message. Please try again later.",
                });
            }

            return { ok: true };
        },
    }),

    newsletterSubscribe: defineAction({
        accept: "form",
        input: z.object({
            email: z.string().email(),
            "cf-turnstile-response": z.string().optional(),
        }),
        handler: async (input, context) => {
            const turnstileSecret = import.meta.env.TURNSTILE_SECRET_KEY;
            const resendApiKey = import.meta.env.RESEND_API_KEY;
            const newsletterSecret = import.meta.env.NEWSLETTER_SECRET;

            if (turnstileSecret) {
                const token = input["cf-turnstile-response"];
                if (!token) {
                    throw new ActionError({
                        code: "BAD_REQUEST",
                        message: "Turnstile verification failed.",
                    });
                }
                let valid: boolean;
                try {
                    valid = await verifyTurnstile(token, turnstileSecret);
                } catch (err) {
                    console.error("[turnstile] fetch error:", err);
                    throw new ActionError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Could not verify request. Please try again.",
                    });
                }
                if (!valid) {
                    throw new ActionError({
                        code: "BAD_REQUEST",
                        message: "Turnstile verification failed.",
                    });
                }
            }

            if (!resendApiKey || !newsletterSecret) {
                console.error("[newsletter] RESEND_API_KEY or NEWSLETTER_SECRET is not set");
                throw new ActionError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Newsletter not configured.",
                });
            }

            const token = await createToken(input.email, newsletterSecret);
            const origin = new URL(context.request.url).origin;
            const confirmUrl = `${origin}/api/newsletter/confirm?token=${encodeURIComponent(token)}`;

            try {
                await sendResendEmail({
                    apiKey: resendApiKey,
                    to: input.email,
                    from: "Aussie Pilot Guide <hello@aussiepilotguide.com>",
                    replyTo: "hello@aussiepilotguide.com",
                    subject: "Confirm your subscription",
                    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 16px">
<h2 style="margin-top:0">Confirm your subscription</h2>
<p>Thanks for subscribing to Aussie Pilot Guide — the Australian flight training blog for student pilots.</p>
<p>Click the button below to confirm your email address and start receiving updates.</p>
<p style="margin:32px 0">
  <a href="${confirmUrl}" style="background:#171717;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">Confirm subscription</a>
</p>
<p style="color:#666;font-size:14px">This link expires in 24 hours. If you didn't subscribe, you can safely ignore this email.</p>
</div>`,
                });
            } catch (err) {
                const detail = err instanceof Error ? err.message : String(err);
                console.error("[newsletter] confirmation email failed:", detail);
                throw new ActionError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Could not send confirmation email. Please try again later.",
                });
            }

            return { ok: true };
        },
    }),
};
