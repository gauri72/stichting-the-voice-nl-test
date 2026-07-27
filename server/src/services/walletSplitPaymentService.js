import { debitWallet, redeemPoints, getOrCreateWallet } from "./walletService.js";

/**
 * Shared V.Wallet-split primitives for any "pay partly from V.Wallet balance,
 * partly by card/iDEAL" checkout (tickets, donations, sponsorships,
 * memberships, V.Commerce orders). The composition order is always the same:
 * points discount first, then the wallet-portion cap against the
 * already-discounted amount, then Stripe covers whatever's left — proven
 * first in walletCheckoutService.js's ticket checkout, generalized here.
 */

/** Applies a points redemption (if any) and returns the resulting amount still due. */
export async function applyPointsDiscount(customerId, pointsToRedeem, amountMinor) {
  if (!pointsToRedeem) return { discountMinor: 0, amountDueMinor: amountMinor };
  const { discountMinor } = await redeemPoints(customerId, pointsToRedeem);
  return { discountMinor, amountDueMinor: Math.max(0, amountMinor - discountMinor) };
}

/** Caps a requested wallet portion at both the customer's balance and what's actually due. */
export async function capWalletPortion(customerId, requestedMinor, amountDueMinor) {
  const wallet = await getOrCreateWallet(customerId);
  return Math.max(0, Math.min(requestedMinor, wallet.balanceMinor, amountDueMinor));
}

/**
 * Debits the wallet for the deferred portion of a split payment, once the
 * card/iDEAL side has actually succeeded. Never throws — callers decide how
 * to handle a failure (e.g. mark the order/record failed rather than issuing
 * something that was never fully paid for).
 */
export async function deferWalletDebit(customerId, amountMinor, opts = {}) {
  if (!amountMinor) return { success: true };
  try {
    await debitWallet(customerId, amountMinor, opts);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
