import { prisma } from '@/lib/db';
import { renderReceiptPdf } from '@/lib/pdf/receipt-pdf';

export const runtime = 'nodejs';
export const maxDuration = 30;

type PdfRouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(
  request: Request,
  { params }: PdfRouteContext
) {
  const { token } = await params;
  const receipt = await prisma.receipt.findUnique({
    where: { publicToken: token },
    select: {
      seq: true,
      number: true,
      issuedAt: true,
      donorName: true,
      donorPan: true,
      amountPaise: true,
      campaignTitle: true,
    },
  });

  if (!receipt) {
    return Response.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  try {
    const buffer = await renderReceiptPdf(receipt);
    const filename = `receipt-${String(receipt.seq).padStart(6, '0')}.pdf`;
    const inline =
      new URL(request.url).searchParams.get('inline') === '1';

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error(
      '[receipt-pdf] render failed',
      error instanceof Error ? error.message : 'UNKNOWN'
    );

    return Response.json({ error: 'PDF_FAILED' }, { status: 500 });
  }
}
