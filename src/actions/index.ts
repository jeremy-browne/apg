import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";

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

async function addKitSubscriber(email: string, apiSecret: string): Promise<void> {
    const res = await fetch("https://api.kit.com/v4/subscribers", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Kit-Api-Key": apiSecret,
        },
        body: JSON.stringify({ email_address: email }),
    });

    // 409 = subscriber already exists — treat as success
    if (!res.ok && res.status !== 409) {
        const body = await res.text();
        console.error(`[kit] API error ${res.status}:`, body);
        throw new Error(`Kit API error ${res.status}: ${body}`);
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
        handler: async (input) => {
            const turnstileSecret = import.meta.env.TURNSTILE_SECRET_KEY;
            const kitApiSecret = import.meta.env.KIT_API_SECRET;

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

            if (!kitApiSecret) {
                console.error("[kit] KIT_API_SECRET is not set");
                throw new ActionError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Newsletter not configured.",
                });
            }

            try {
                await addKitSubscriber(input.email, kitApiSecret);
            } catch (err) {
                const detail = err instanceof Error ? err.message : String(err);
                console.error("[kit] subscribe failed:", detail);
                throw new ActionError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: `Debug: ${detail}`,
                });
            }

            return { ok: true };
        },
    }),
};
