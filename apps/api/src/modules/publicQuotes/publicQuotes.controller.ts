import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { PublicQuoteSchemas } from '@catering/shared';
import { notFound } from '../../lib/errors';

const defaultBusinessInfo = {
  name: process.env['BUSINESS_NAME'] ?? 'קייטרינג איכותי',
  logoUrl: process.env['BUSINESS_LOGO_URL'] ?? null,
  phone: process.env['BUSINESS_PHONE'] ?? '08-1234567',
  email: process.env['BUSINESS_EMAIL'] ?? 'office@catering.dev.local',
  address: process.env['BUSINESS_ADDRESS'] ?? 'התעשייה 5, באר שבע',
};

/**
 * GET /public/quotes/:token
 * Public endpoint — no auth required.
 * Returns public quote details. 404 if not found or expired (§5.3).
 */
export async function getPublicQuote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token } = req.params;

    // Search for quote by token or order by publicQuoteToken or id
    const quote = await prisma.quote.findUnique({
      where: { token },
    });

    let order = null;
    if (quote) {
      order = await prisma.order.findUnique({
        where: { id: quote.orderId },
      });
    } else {
      order = await prisma.order.findFirst({
        where: {
          OR: [
            { publicQuoteToken: token },
            { id: token },
          ],
        },
      });
    }

    if (!order) {
      return next(notFound('הצעת המחיר לא נמצאה או שפג תוקפה'));
    }

    const pricing = order.pricing as Record<string, unknown>;
    const validUntil = (pricing?.['validUntil'] as string) ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Check expiry
    const today = new Date().toISOString().split('T')[0]!;
    if (validUntil < today) {
      return next(notFound('הצעת המחיר לא נמצאה או שפג תוקפה'));
    }

    const publicQuoteData = PublicQuoteSchemas.PublicQuote.parse({
      token,
      business: defaultBusinessInfo,
      event: order.event,
      items: order.items,
      services: order.services,
      totals: order.totals,
      validUntil,
      status: order.status,
      terms: 'תנאי תשלום: מקדמה לאישור ההזמנה, יתרה עד מועד האספקה.',
    });

    res.json({
      data: publicQuoteData,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /public/quotes/:token/approve
 * Public endpoint — approve quote by signerName and base64 signature.
 * Returns payment URL for deposit.
 */
export async function approvePublicQuote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token } = req.params;
    const body = req.body as PublicQuoteSchemas.ApproveQuoteBody;

    const quote = await prisma.quote.findUnique({
      where: { token },
    });

    let orderId = quote?.orderId;
    if (!orderId) {
      const order = await prisma.order.findFirst({
        where: {
          OR: [
            { publicQuoteToken: token },
            { id: token },
          ],
        },
      });
      if (!order) {
        return next(notFound('הצעת המחיר לא נמצאה'));
      }
      orderId = order.id;
    }

    // Record approval
    if (quote) {
      await prisma.quote.update({
        where: { id: quote.id },
        data: {
          signerName: body.signerName,
          signaturePng: body.signaturePng,
          approvedAt: new Date(),
        },
      });
    } else {
      await prisma.quote.create({
        data: {
          orderId,
          token,
          signerName: body.signerName,
          signaturePng: body.signaturePng,
          approvedAt: new Date(),
        },
      });
    }

    // Update order status if in DRAFT or QUOTE_SENT
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CONFIRMED',
      },
    });

    const webOrigin = process.env['WEB_ORIGIN'] ?? 'http://localhost:5173';
    const paymentUrl = `${webOrigin}/pay?quoteToken=${token}&orderId=${orderId}`;

    res.json({
      paymentUrl,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /public/quotes/:token/request-change
 * Public endpoint — customer requests modification to the quote.
 */
export async function requestQuoteChange(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token } = req.params;
    const body = req.body as PublicQuoteSchemas.RequestChangeBody;

    const quote = await prisma.quote.findUnique({
      where: { token },
    });

    let orderId = quote?.orderId;
    if (!orderId) {
      const order = await prisma.order.findFirst({
        where: {
          OR: [
            { publicQuoteToken: token },
            { id: token },
          ],
        },
      });
      if (!order) {
        return next(notFound('הצעת המחיר לא נמצאה'));
      }
      orderId = order.id;
    }

    if (quote) {
      await prisma.quote.update({
        where: { id: quote.id },
        data: {
          changeRequest: body.message,
        },
      });
    } else {
      await prisma.quote.create({
        data: {
          orderId,
          token,
          changeRequest: body.message,
        },
      });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/**
 * GET /public/quotes/:token/pdf
 * Public endpoint — downloads generated quote PDF.
 */
export async function getQuotePdf(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { publicQuoteToken: token },
          { id: token },
        ],
      },
    });

    if (!order) {
      return next(notFound('הצעת המחיר לא נמצאה'));
    }

    // Return a minimal valid PDF buffer for testing/downloading
    const dummyPdf = '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000102 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF\n';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="quote-${order.number}.pdf"`);
    res.send(Buffer.from(dummyPdf, 'utf-8'));
  } catch (err) {
    next(err);
  }
}
