import { definePlugin, type PluginContext } from "emdash";

export interface EmailDeliverEvent {
	message: {
		to: string;
		subject: string;
		text: string;
		html?: string;
		replyTo?: string;
	};
	source: string;
}

export const RESEND_EMAIL_PLUGIN_ID = "emdash-resend-email";

/**
 * Standard EmDash email provider plugin using Resend (https://resend.com)
 */
export default definePlugin({
	hooks: {
		"email:deliver": {
			exclusive: true,
			handler: async (event: EmailDeliverEvent, ctx: PluginContext) => {
				const { message, source } = event;

				const storedKey = ctx?.kv ? await ctx.kv.get<string>("apiKey") : null;
				const apiKey =
					storedKey ??
					process.env.RESEND_API_KEY ??
					(import.meta.env as Record<string, string | undefined>).RESEND_API_KEY;

				if (!apiKey) {
					throw new Error(
						"Resend API key is not configured. Set RESEND_API_KEY in your environment.",
					);
				}

				const storedFrom = ctx?.kv ? await ctx.kv.get<string>("from") : null;
				const from =
					storedFrom ??
					process.env.RESEND_FROM_EMAIL ??
					(import.meta.env as Record<string, string | undefined>).RESEND_FROM_EMAIL ??
					"Aussie Pilot Guide <hello@aussiepilotguide.com>";

				const replyTo = message.replyTo;

				const payload: Record<string, unknown> = {
					from,
					to: [message.to],
					subject: message.subject,
					text: message.text,
				};

				if (message.html) {
					payload.html = message.html;
				}

				if (replyTo) {
					payload.reply_to = replyTo;
				}

				const res = await fetch("https://api.resend.com/emails", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${apiKey}`,
					},
					body: JSON.stringify(payload),
				});

				if (!res.ok) {
					const errorBody = await res.text().catch(() => "");
					console.error(
						`[resend-email] Failed to deliver email (source: ${source}) to ${message.to}: ${res.status} ${errorBody}`,
					);
					throw new Error(
						`Resend email delivery failed (${res.status}): ${errorBody || res.statusText}`,
					);
				}

				console.info(
					`[resend-email] Email delivered via Resend to ${message.to} (subject: "${message.subject}")`,
				);
			},
		},
	},
});
