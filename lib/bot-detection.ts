// A shared link to an event page gets re-fetched by link-preview generators
// (Slack, Discord, WhatsApp, LinkedIn, iMessage) and crawled by search/SEO
// bots — several of which now run a real JS-executing headless browser, so
// they hit client-side effects a plain HTML scrape wouldn't. Checkout.tsx
// mounts the Stripe widget on page load rather than waiting for a click
// (see its own comment), so every one of those visits was creating a real
// live Stripe Checkout Session: 308 in 28 hours for one event, 0 completed.
// This is the narrowest fix — block session creation for known non-human
// user agents without touching the real-user mount-on-load behavior.
const BOT_USER_AGENT_PATTERN =
  /bot|crawl|spider|slurp|mediapartners|facebookexternalhit|whatsapp|telegrambot|discordbot|slackbot|linkedinbot|twitterbot|pinterest|embedly|quora link preview|outbrain|vkshare|w3c_validator|headlesschrome|phantomjs|puppeteer|playwright|python-requests|scrapy|go-http-client|okhttp|axios\/|node-fetch|postmanruntime|insomnia|uptimerobot|pingdom|site24x7|ahrefsbot|semrushbot|mj12bot|dotbot|petalbot|bytespider|gptbot|ccbot|anthropic/i

export function isLikelyBot(userAgent: string | null): boolean {
  // Real browsers always send a UA; a request with none is itself a signal.
  if (!userAgent) return true
  return BOT_USER_AGENT_PATTERN.test(userAgent)
}
