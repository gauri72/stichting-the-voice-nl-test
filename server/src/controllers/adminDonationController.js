import { handleError as handleErrorBase } from "../utils/handleError.js";

function handleError(res, error) {
  return handleErrorBase(res, error, { logTag: "[admin/donations]" });
}

function parseFilters(query) {
  return {
    search: query.search || "",
    donationType: query.donationType || "",
    paymentStatus: query.paymentStatus || "",
    receiptStatus: query.receiptStatus || "",
    recurringStatus: query.recurringStatus || "",
    campaignName: query.campaignName || "",
    dateFrom: query.dateFrom || "",
    dateTo: query.dateTo || "",
    amountMin: query.amountMin || "",
    amountMax: query.amountMax || "",
    exportType: query.exportType || "",
  };
}

export async function donationDashboard(req, res) {
  try {
    const { getDonationDashboardStats } = await import("../services/adminDonationService.js");
    const stats = await getDonationDashboardStats();
    return res.status(200).json({ stats });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listDonations(req, res) {
  try {
    console.log("[DONATIONS_ADMIN_FETCH_STARTED]", JSON.stringify(parseFilters(req.query)));
    const { listDonations, getDonationDashboardStats } = await import("../services/adminDonationService.js");
    const filters = parseFilters(req.query);
    const [donations, stats] = await Promise.all([
      listDonations(filters),
      getDonationDashboardStats(),
    ]);
    console.log("[DONATIONS_ADMIN_FETCH_COUNT]", donations.length, {
      paymentStatuses: [...new Set(donations.map((d) => d.paymentStatus))],
      receiptStatuses: [...new Set(donations.map((d) => d.receiptStatus))],
    });
    return res.status(200).json({
      donations,
      records: donations,
      stats,
      pagination: { total: donations.length, page: 1, limit: 500 },
    });
  } catch (error) {
    console.error("[DONATIONS_ADMIN_FETCH_ERROR]", error.message);
    return handleError(res, error);
  }
}

export async function getDonation(req, res) {
  try {
    const { getDonationById } = await import("../services/adminDonationService.js");
    const detail = await getDonationById(req.params.id);
    return res.status(200).json(detail);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createDonation(req, res) {
  try {
    const { createDonation } = await import("../services/adminDonationService.js");
    const donation = await createDonation(req.body || {}, req.admin?.id || req.admin?._id);
    return res.status(201).json({ donation });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateDonation(req, res) {
  try {
    const { updateDonation } = await import("../services/adminDonationService.js");
    const donation = await updateDonation(
      req.params.id,
      req.body || {},
      req.admin?.id || req.admin?._id
    );
    return res.status(200).json({ donation });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteDonation(req, res) {
  try {
    const { deleteDonation } = await import("../services/adminDonationService.js");
    const result = await deleteDonation(req.params.id, req.admin?.id || req.admin?._id);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function sendReminder(req, res) {
  try {
    const { sendDonationReminder } = await import("../services/adminDonationService.js");
    const donation = await sendDonationReminder(
      req.params.id,
      req.admin?.id || req.admin?._id,
      req.body || {}
    );
    return res.status(200).json({ donation });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function resendReceipt(req, res) {
  try {
    const { resendDonationReceipt } = await import("../services/adminDonationService.js");
    const donation = await resendDonationReceipt(req.params.id, req.admin?.id || req.admin?._id);
    return res.status(200).json({ donation });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function downloadReceipt(req, res) {
  try {
    const { downloadDonationReceipt } = await import("../services/adminDonationService.js");
    const { pdf, filename } = await downloadDonationReceipt(req.params.id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(pdf);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function markPaid(req, res) {
  try {
    const { markDonationPaid } = await import("../services/adminDonationService.js");
    const donation = await markDonationPaid(
      req.params.id,
      req.admin?.id || req.admin?._id,
      req.body || {}
    );
    return res.status(200).json({ donation });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function markRefunded(req, res) {
  try {
    const { markDonationRefunded } = await import("../services/adminDonationService.js");
    const donation = await markDonationRefunded(req.params.id, req.admin?.id || req.admin?._id);
    return res.status(200).json({ donation });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function exportDonations(req, res) {
  try {
    const { exportDonations } = await import("../services/adminDonationService.js");
    const csv = await exportDonations(parseFilters(req.query));
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="donations-export.csv"');
    return res.send(csv);
  } catch (error) {
    return handleError(res, error);
  }
}
