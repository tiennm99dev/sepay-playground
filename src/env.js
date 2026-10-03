import { defineEnvVars } from '@sveltejs/kit/env';

/**
 * Optional runtime variable: passes the raw value through, so an unset variable
 * stays `undefined` and the `??` fallbacks in `lib/server/redis.js` keep working.
 * @param {string | undefined} input
 */
const optional = (input) => input;

// SePay settings are inlined at build time; Redis settings are read at runtime.
export const variables = defineEnvVars({
	SEPAY_WEBHOOK_API_KEY: { static: true },
	DEV_SIMULATE_TOKEN: { static: true },
	SEPAY_ORDER_PREFIX: { static: true },
	SEPAY_ACCOUNT_NUMBER: { static: true },
	SEPAY_BANK_CODE: { static: true },
	UPSTASH_REDIS_REST_URL: { schema: optional },
	KV_REST_API_URL: { schema: optional },
	UPSTASH_REDIS_REST_TOKEN: { schema: optional },
	KV_REST_API_TOKEN: { schema: optional },
	KEY_PREFIX: { schema: optional }
});
