import type { DiscountType } from './enums';

export interface TotalsInput {
  lines: { qty: number; unitPrice: number }[];
  discountType: DiscountType;
  discountValue: number;
  vatPercent: number;
  pricesIncludeVat: boolean;
  depositPercent: number;
  guests: number;
  paid?: number;
}

export interface Totals {
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  deposit: number;
  paid: number;
  balance: number;
  perGuest: number;
}

const r = (n: number) => Math.round(n);

export function calcTotals(i: TotalsInput): Totals {
  const gross = r(i.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0));
  const subtotal = i.pricesIncludeVat ? r(gross / (1 + i.vatPercent / 100)) : gross;
  const discount =
    i.discountType === 'PERCENT' ? r(subtotal * i.discountValue / 100) :
    i.discountType === 'FIXED' ? Math.min(i.discountValue, subtotal) : 0;
  const vat = r((subtotal - discount) * i.vatPercent / 100);
  const total = subtotal - discount + vat;
  const deposit = r(total * i.depositPercent / 100);
  const paid = i.paid ?? 0;
  return {
    subtotal, discount, vat, total, deposit, paid,
    balance: total - paid,
    perGuest: i.guests > 0 ? r(total / i.guests) : 0
  };
}

const fmt = new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: 0, maximumFractionDigits: 2 });

export const formatMoney = (agorot: number) => fmt.format(agorot / 100);
export const toAgorot = (shekels: number) => Math.round(shekels * 100);
