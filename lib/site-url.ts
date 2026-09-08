// Where this site actually lives. Vercel treats the www host as primary and
// 307-redirects the apex to it, and redirects are not universally followed:
// Stripe drops a redirected webhook as a failed delivery, and Google rejects
// an OAuth redirect_uri that is not an exact registered match. So the host
// has to be right at the point of use, not "close enough".
//
// One constant because the fallbacks had already drifted — the Gmail OAuth
// routes defaulted to www while the task-email links defaulted to the apex,
// which is the same class of mismatch that stranded the first ticket sale.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.chefnanawilmot.com'
