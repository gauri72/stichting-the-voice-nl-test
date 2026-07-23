import {
  listWallets,
  listTransactionsForAdmin,
  adminCreditWallet,
  adminDebitWallet,
  adminAdjustPoints,
  getGlobalSettings,
  updateGlobalSettings,
  listAiBookingsForAdmin,
  getWalletAnalytics,
  refundOrder,
} from "../services/adminWalletService.js";
import { handleError as handleErrorBase } from "../utils/handleError.js";

function handleError(res, error) {
  return handleErrorBase(res, error, { logTag: "[admin-wallet]" });
}

export async function getWallets(req, res) {
  try {
    const wallets = await listWallets({ search: req.query.search || "" });
    return res.json({ wallets });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getTransactions(req, res) {
  try {
    const transactions = await listTransactionsForAdmin({ customerId: req.query.customerId, type: req.query.type });
    return res.json({ transactions });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function postCredit(req, res) {
  try {
    const { customerId, amountMinor, reason } = req.body || {};
    const result = await adminCreditWallet(customerId, Number(amountMinor), reason, req.admin?.id);
    return res.status(201).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function postDebit(req, res) {
  try {
    const { customerId, amountMinor, reason } = req.body || {};
    const result = await adminDebitWallet(customerId, Number(amountMinor), reason, req.admin?.id);
    return res.status(201).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function postPointsAdjust(req, res) {
  try {
    const { customerId, points, reason } = req.body || {};
    const result = await adminAdjustPoints(customerId, Number(points), reason, req.admin?.id);
    return res.status(201).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getSettings(req, res) {
  try {
    const settings = await getGlobalSettings();
    return res.json({ settings });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function patchSettings(req, res) {
  try {
    const settings = await updateGlobalSettings(req.body || {});
    return res.json({ settings });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getAiBookings(req, res) {
  try {
    const bookings = await listAiBookingsForAdmin({});
    return res.json({ bookings });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getAnalytics(req, res) {
  try {
    const analytics = await getWalletAnalytics({ from: req.query.from, to: req.query.to });
    return res.json({ analytics });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function postRefund(req, res) {
  try {
    const { orderId, method, reason } = req.body || {};
    const result = await refundOrder(orderId, { method, reason }, req.admin?.id);
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}
