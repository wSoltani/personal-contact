# Portfolio Contact Form Handler

A Cloudflare Worker that handles contact form submissions from your portfolio website and sends them to your email using Resend.

## Setup and Deployment

### Prerequisites

1. A Cloudflare account
2. Wrangler CLI installed (`npm install -g wrangler`)
3. A Resend account and API key (get one at [resend.com](https://resend.com))

### Configuration Steps

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set your Resend API key as a secret (never commit this to your code):

   ```bash
   npx wrangler secret put RESEND_API_KEY
   ```

   When prompted, enter your Resend API key.

3. Verify your domain in Resend to be able to send emails from a custom domain.

4. Update your `wrangler.jsonc` with the correct values:

   - `RECIPIENT_EMAIL`: The email where you want to receive contact form submissions
   - `PORTFOLIO_ORIGIN`: Your portfolio website URL (e.g., "https://wsoltani.github.io")

5. Deploy the worker:

   ```bash
   npx wrangler deploy
   ```

6. After deployment, Wrangler will show you the Worker URL. Update your portfolio's contact form to use this URL.

### Update your Contact Form

In your portfolio's contact form (contact.astro), update the fetch URL to your deployed Worker URL:

```javascript
const response = await fetch('https://personal-contact.your-username.workers.dev', {
	// ...
});
```

Replace `https://personal-contact.your-username.workers.dev` with your actual Worker URL.

## Development

To test locally:

```bash
wrangler dev
```

You can test the worker using tools like Postman or curl to send POST requests with JSON data.

Example request:

```bash
curl -X POST https://personal-contact.your-username.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","subject":"Test","message":"This is a test message"}'
```

## Security Considerations

- The Worker implements CORS to only accept requests from your portfolio website
- Input validation is performed on all form fields
- API keys are stored as secrets and not in the code
