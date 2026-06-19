import { getNextSequence } from "./sequence.js";

export function throwFinanceError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  throw err;
}

export function formatMoney(minor, currency = "EUR") {
  try {
    return new Intl.NumberFormat("nl-NL", { style: "currency", currency }).format(
      Number(minor || 0) / 100
    );
  } catch {
    return `€${(Number(minor || 0) / 100).toFixed(2)}`;
  }
}

export function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateShort(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL");
}

export async function nextFinanceId(prefix) {
  const seq = await getNextSequence(prefix);
  const year = new Date().getFullYear();
  return `${prefix.toUpperCase()}-${year}-${String(seq).padStart(6, "0")}`;
}

export function computeLineTotal(item) {
  const qty = Number(item.quantity) || 1;
  const unit = Number(item.unitPrice) || 0;
  const discount = Number(item.discount) || 0;
  const subtotal = qty * unit - discount;
  return Math.max(0, Math.round(subtotal));
}

export function computeInvoiceTotals(lineItems, discountAmount = 0) {
  let subtotal = 0;
  let vatAmount = 0;
  for (const item of lineItems || []) {
    const lineTotal = computeLineTotal(item);
    const vatRate = Number(item.vatRate) || 0;
    subtotal += lineTotal;
    vatAmount += Math.round((lineTotal * vatRate) / 100);
  }
  const discount = Number(discountAmount) || 0;
  const totalAmount = Math.max(0, subtotal + vatAmount - discount);
  return { subtotal, vatAmount, discountAmount: discount, totalAmount };
}

export function computeBudgetTotals(budget) {
  const plannedIncomeTotal = (budget.plannedIncomeLines || []).reduce(
    (s, l) => s + (Number(l.plannedAmount) || 0),
    0
  );
  const actualIncomeTotal = (budget.actualIncomeLines || []).reduce(
    (s, l) => s + (Number(l.actualAmount) || 0),
    0
  );
  const plannedExpenseTotal = (budget.plannedExpenseLines || []).reduce(
    (s, l) => s + (Number(l.plannedAmount) || 0),
    0
  );
  const actualExpenseTotal = (budget.actualExpenseLines || []).reduce(
    (s, l) => s + (Number(l.actualAmount) || 0),
    0
  );
  const plannedNetResult = plannedIncomeTotal - plannedExpenseTotal;
  const actualNetResult = actualIncomeTotal - actualExpenseTotal;
  const variance = actualNetResult - plannedNetResult;
  const incomeVariance = actualIncomeTotal - plannedIncomeTotal;
  const expenseVariance = actualExpenseTotal - plannedExpenseTotal;
  const attendance = Number(budget.actualAttendance) || Number(budget.expectedAttendance) || 0;
  const breakEvenAttendance =
    attendance > 0 && actualIncomeTotal > 0
      ? Math.ceil((plannedExpenseTotal / actualIncomeTotal) * attendance)
      : 0;
  const avgRevenuePerAttendee = attendance > 0 ? Math.round(actualIncomeTotal / attendance) : 0;
  const avgCostPerAttendee = attendance > 0 ? Math.round(actualExpenseTotal / attendance) : 0;

  return {
    plannedIncomeTotal,
    actualIncomeTotal,
    plannedExpenseTotal,
    actualExpenseTotal,
    plannedNetResult,
    actualNetResult,
    variance,
    incomeVariance,
    expenseVariance,
    breakEvenAttendance,
    avgRevenuePerAttendee,
    avgCostPerAttendee,
  };
}

export function csvEscape(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}
