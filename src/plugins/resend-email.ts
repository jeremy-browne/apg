import { definePlugin, type PluginContext } from "emdash";

/**
 * Standard EmDash email provider plugin backed by Resend (https://resend.com).
 *
 * Registers the exclusive `email:deliver` hook, so everything EmDash sends —
 * invitations, magic links, password recovery, the Settings > Email test — goes
 * through Resend. Registration requires the `hooks.email-transport:register`
 * capability, declared on the descriptor in `astro.config.mjs`.
 *
 * Credentials live in the plugin's own KV (the `options` table, namespaced
 * `plugin:emdash-resend-email:*`) and are set from the admin under
 * Plugins > Resend > Settings. A `PluginContext` has no access to
 * `locals.runtime.env`, and `process.env` is not available on Workers, so KV is
 * the only viable place for them — note this means the key must be entered
 * separately in dev and in production, which use different databases.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/** Placeholder the admin sends back for an unchanged secret field. */
const MASKED_SECRET = "********";

const KV_API_KEY = "settings:apiKey";
const KV_FROM_ADDRESS = "settings:fromAddress";

/** Matches the verified sender already used by the contact + newsletter actions. */
const DEFAULT_FROM_ADDRESS = "Aussie Pilot Guide <hello@aussiepilotguide.com>";

const EMAIL_PATTERN = /^.+@.+\..+$/;

/**
 * Core's `EmailMessage` is `{ to, subject, text, html? }` — no `replyTo`.
 * See `emdash/src/plugins/types.ts`.
 */
interface EmailDeliverEvent {
	message: {
		to: string;
		subject: string;
		text: string;
		html?: string;
	};
	source: string;
}

/** A Block Kit interaction posted to the plugin's `admin` route. */
interface BlockInteraction {
	type: string;
	page?: string;
	action_id?: string;
	values?: Record<string, unknown>;
}

/**
 * A From address may be either a bare address or `Name <address>` — validate
 * whatever sits inside the angle brackets when they're present.
 */
function isValidSender(value: string): boolean {
	const match = value.match(/<([^>]+)>\s*$/);
	return EMAIL_PATTERN.test(match ? match[1].trim() : value.trim());
}

async function sendViaResend(
	ctx: PluginContext,
	apiKey: string,
	payload: { from: string; to: string[]; subject: string; text: string; html?: string },
): Promise<{ id: string }> {
	if (!ctx.http) {
		throw new Error(
			"Missing the network:request capability — add it (with allowedHosts) to the plugin descriptor.",
		);
	}

	const res = await ctx.http.fetch(RESEND_ENDPOINT, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify(payload),
	});

	if (!res.ok) {
		const body = await res.text().catch(() => "");
		throw new Error(`Resend API returned ${res.status}: ${body || res.statusText}`);
	}

	return (await res.json()) as { id: string };
}

async function readSettings(ctx: PluginContext) {
	const [apiKey, fromAddress] = await Promise.all([
		ctx.kv.get<string>(KV_API_KEY),
		ctx.kv.get<string>(KV_FROM_ADDRESS),
	]);
	return { apiKey, fromAddress };
}

async function buildSettingsPage(ctx: PluginContext) {
	const { apiKey, fromAddress } = await readSettings(ctx);

	return {
		blocks: [
			{
				type: "section",
				text: "Configure your Resend API credentials to enable outbound email — invitations, magic links and password recovery all use this provider.",
			},
			{
				type: "form",
				submit: { label: "Save Settings", action_id: "save_settings" },
				fields: [
					{
						type: "secret_input",
						action_id: "apiKey",
						label: "API Key",
						placeholder: "re_...",
						has_value: !!apiKey,
					},
					{
						type: "text_input",
						action_id: "fromAddress",
						label: "From Address",
						placeholder: DEFAULT_FROM_ADDRESS,
						initial_value: fromAddress ?? DEFAULT_FROM_ADDRESS,
					},
				],
			},
			{
				type: "section",
				text: "Send a test email to verify your credentials.",
			},
			{
				type: "form",
				submit: { label: "Send Test Email", action_id: "test_email" },
				fields: [
					{
						type: "text_input",
						action_id: "testEmailAddress",
						label: "Test Email Recipient",
						placeholder: "you@example.com",
					},
				],
			},
		],
	};
}

async function pageWithToast(
	ctx: PluginContext,
	message: string,
	type: "success" | "error" | "info",
) {
	return { ...(await buildSettingsPage(ctx)), toast: { message, type } };
}

async function saveSettings(ctx: PluginContext, values: Record<string, unknown>) {
	try {
		// The admin echoes back the mask when the secret field is left untouched.
		if (typeof values.apiKey === "string" && values.apiKey && values.apiKey !== MASKED_SECRET) {
			await ctx.kv.set(KV_API_KEY, values.apiKey.trim());
		}

		if (typeof values.fromAddress === "string") {
			const fromAddress = values.fromAddress.trim();
			if (!isValidSender(fromAddress)) {
				return pageWithToast(
					ctx,
					'Invalid From Address — use an email address or "Name <email@domain>".',
					"error",
				);
			}
			await ctx.kv.set(KV_FROM_ADDRESS, fromAddress);
		}

		return pageWithToast(ctx, "Settings saved.", "success");
	} catch (error) {
		ctx.log.error("Failed to save Resend settings", error);
		return pageWithToast(ctx, "Failed to save settings.", "error");
	}
}

async function sendTestEmail(ctx: PluginContext, values: Record<string, unknown>) {
	try {
		const { apiKey, fromAddress } = await readSettings(ctx);
		if (!apiKey || !fromAddress) {
			return pageWithToast(
				ctx,
				"Save an API Key and From Address before sending a test.",
				"error",
			);
		}

		const to = typeof values.testEmailAddress === "string" ? values.testEmailAddress.trim() : "";
		if (!EMAIL_PATTERN.test(to)) {
			return pageWithToast(ctx, "Enter a valid test email address.", "error");
		}

		const result = await sendViaResend(ctx, apiKey, {
			from: fromAddress,
			to: [to],
			subject: `Resend test email from ${ctx.site.name}`,
			text: "Hello from the EmDash Resend plugin. If you received this, your credentials are correct.",
		});

		return pageWithToast(ctx, `Test email sent (${result.id}).`, "success");
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		ctx.log.error("Resend test email failed", error);
		return pageWithToast(ctx, `Error: ${message}`, "error");
	}
}

export default definePlugin({
	hooks: {
		"email:deliver": {
			exclusive: true,
			handler: async (event: EmailDeliverEvent, ctx: PluginContext) => {
				const { message, source } = event;
				const { apiKey, fromAddress } = await readSettings(ctx);

				if (!apiKey || !fromAddress) {
					ctx.log.error("Resend API key or From Address is not set");
					throw new Error(
						"Resend is not configured. Set the API Key and From Address under Plugins > Resend > Settings.",
					);
				}

				const result = await sendViaResend(ctx, apiKey, {
					from: fromAddress,
					to: [message.to],
					subject: message.subject,
					text: message.text,
					...(message.html && { html: message.html }),
				});

				ctx.log.info("Email delivered via Resend", { id: result.id, source });
			},
		},
	},

	routes: {
		admin: {
			handler: async (routeCtx: { input: unknown }, ctx: PluginContext) => {
				const interaction = routeCtx.input as BlockInteraction;

				if (interaction.type === "page_load" && interaction.page === "/settings") {
					return buildSettingsPage(ctx);
				}

				if (interaction.type === "form_submit") {
					if (interaction.action_id === "save_settings") {
						return saveSettings(ctx, interaction.values ?? {});
					}
					if (interaction.action_id === "test_email") {
						return sendTestEmail(ctx, interaction.values ?? {});
					}
				}

				return { blocks: [] };
			},
		},
	},
});
