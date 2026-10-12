/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

/**
 * Contact Form Handler Worker
 *
 * This worker handles contact form submissions and sends emails using Resend
 */

interface Env {
	// Define environment variables
	RESEND_API_KEY: string;
	RECIPIENT_EMAIL: string;
	PORTFOLIO_ORIGIN: string;
}

interface ContactFormData {
	name: string;
	email: string;
	subject: string;
	message: string;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// Get the CORS headers based on environment
		const corsHeaders = getCorsHeaders(env.PORTFOLIO_ORIGIN);

		// Handle CORS preflight requests
		if (request.method === 'OPTIONS') {
			return handleCors(corsHeaders);
		}

		// Only allow POST requests for the form
		if (request.method !== 'POST') {
			return new Response('Method not allowed', { status: 405 });
		}

		try {
			// Parse the form data from the request
			const formData: ContactFormData = await request.json();

			// Validate the form data
			if (!isValidFormData(formData)) {
				return new Response(JSON.stringify({ error: 'Invalid form data' }), { status: 400, headers: corsHeaders });
			}

			// Send the email using Resend API
			const emailResponse = await sendEmail(formData, env.RESEND_API_KEY, env.RECIPIENT_EMAIL);

			if (!emailResponse.ok) {
				const errorData = await emailResponse.json();
				console.error('Resend API error:', errorData);
				return new Response(JSON.stringify({ error: 'Failed to send email' }), { status: 500, headers: corsHeaders });
			}

			// Return success response
			return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
		} catch (error) {
			console.error('Error processing form:', error);
			return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: corsHeaders });
		}
	},
} satisfies ExportedHandler<Env>;

// Generate CORS headers for cross-domain requests
function getCorsHeaders(origin: string): HeadersInit {
	return {
		'Access-Control-Allow-Origin': origin,
		'Access-Control-Allow-Methods': 'POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type',
		'Content-Type': 'application/json',
	};
}

// Handle CORS preflight requests
function handleCors(headers: HeadersInit): Response {
	return new Response(null, {
		status: 204,
		headers,
	});
}

// Validate the form data
function isValidFormData(data: any): data is ContactFormData {
	return (
		typeof data === 'object' &&
		typeof data.name === 'string' &&
		data.name.trim() !== '' &&
		typeof data.email === 'string' &&
		data.email.includes('@') &&
		typeof data.subject === 'string' &&
		data.subject.trim() !== '' &&
		typeof data.message === 'string' &&
		data.message.trim() !== ''
	);
}

// Escape what visitors typed, so it shows up as plain text in the email
function escapeHtml(text: string): string {
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Send the email using the Resend API
async function sendEmail(formData: ContactFormData, apiKey: string, recipientEmail: string): Promise<Response> {
	const name = escapeHtml(formData.name);
	const email = escapeHtml(formData.email);
	const subject = escapeHtml(formData.subject);
	const message = escapeHtml(formData.message);
	return fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify({
			// The sender name and subject tag mark it as coming from the site at a glance
			from: 'wsoltani.com contact form <contact@wsoltani.com>',
			to: recipientEmail,
			subject: `[wsoltani.com] ${formData.subject} from ${formData.name}`.replace(/\s+/g, ' '),
			html: `
				<h2>New Contact Form Submission</h2>
				<p><strong>Name:</strong> ${name}</p>
				<p><strong>Email:</strong> ${email}</p>
				<p><strong>Subject:</strong> ${subject}</p>
				<p><strong>Message:</strong></p>
				<p>${message.replace(/\n/g, '<br>')}</p>
			`,
			reply_to: formData.email,
		}),
	});
}
