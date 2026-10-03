import { claimWebhookId, markPaid, getOrder } from '#lib/server/orders.js';
import { verifyWebhookAuth, extractOrderCode } from '#lib/server/sepay.js';

/**
 * SePay POSTs here. Spec:
 *  - Respond 200 {"success": true} within 30s on every accepted call.
 *  - 4xx only when auth fails (so SePay retries don't hammer a misconfigured route).
 *  - Idempotent on payload.id; outgoing transfers ignored.
 */
export async function POST({ request }) {
	if (!verifyWebhookAuth(request)) {
		return Response.json({ success: false, error: 'unauthorized' }, { status: 401 });
	}

	/** @type {import('#lib/types.js').SepayWebhookPayload} */
	let payload;
	try {
		payload = await request.json();
	} catch {
		return Response.json({ success: false, error: 'invalid json' }, { status: 400 });
	}

	if (payload.transferType !== 'in') {
		return Response.json({ success: true, ignored: 'outgoing' });
	}

	const fresh = await claimWebhookId(payload.id);
	if (!fresh) {
		return Response.json({ success: true, deduped: true });
	}

	const code = extractOrderCode(payload);
	if (!code) {
		console.warn('[sepay] unmatched webhook', { id: payload.id, content: payload.content });
		return Response.json({ success: true, unmatched: true });
	}

	const existing = await getOrder(code);
	if (!existing) {
		console.warn('[sepay] webhook for missing/expired order', { id: payload.id, code });
		return Response.json({ success: true, orphan: true });
	}

	const updated = await markPaid(code, {
		paidAt: payload.transactionDate,
		txReference: payload.referenceCode
	});

	return Response.json({ success: true, code, status: updated?.status });
}
