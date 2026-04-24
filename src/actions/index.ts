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
    const data = (await res.json()) as { success: boolean };
    return data.success;
}

async function addKitSubscriber(email: string, apiSecret: string): Promise<void> {
    const res = await fetch("https://api.kit.com/v4/subscribers", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiSecret}`,
        },
        body: JSON.stringify({ email_address: email }),
    });

    // 409 = subscriber already exists — treat as success
    if (!res.ok && res.status !== 409) {
        throw new Error(`Kit API error: ${res.status}`);
    }
}

export const server = {
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
                const valid = await verifyTurnstile(token, turnstileSecret);
                if (!valid) {
                    throw new ActionError({
                        code: "BAD_REQUEST",
                        message: "Turnstile verification failed.",
                    });
                }
            }

            if (!kitApiSecret) {
                throw new ActionError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Newsletter not configured.",
                });
            }

            try {
                await addKitSubscriber(input.email, kitApiSecret);
            } catch {
                throw new ActionError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to subscribe. Please try again later.",
                });
            }

            return { ok: true };
        },
    }),
};
