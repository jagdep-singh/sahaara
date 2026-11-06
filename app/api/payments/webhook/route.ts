import {
  PaymentError,
  processPaymentEvent,
} from '@/lib/payments';

export const runtime = 'nodejs';
export const maxDuration = 30;

const ERROR_STATUS = {
  BAD_SIGNATURE: 401,
  STALE: 401,
  BAD_PAYLOAD: 400,
  NOT_FOUND: 404,
} as const;

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature =
    request.headers.get('x-webhook-signature') ??
    request.headers.get('x-signature');

  try {
    const result = await processPaymentEvent(rawBody, signature);

    return Response.json(result);
  } catch (error) {
    if (error instanceof PaymentError) {
      return Response.json(
        { error: error.code },
        { status: ERROR_STATUS[error.code] }
      );
    }

    console.error('[webhook] processing failed');

    return Response.json(
      { error: 'INTERNAL' },
      { status: 500 }
    );
  }
}
