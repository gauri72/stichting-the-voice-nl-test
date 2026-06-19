function handleError(res, error) {
  const status = error.status || 500;
  const message = error.message || "Something went wrong.";
  if (status >= 500) console.error("[admin/sponsorships]", error);
  return res.status(status).json({ error: message });
}

function parseFilters(query) {
  return {
    search: query.search || "",
    paymentStatus: query.paymentStatus || "",
    sponsorshipStatus: query.sponsorshipStatus || "",
    receiptStatus: query.receiptStatus || "",
    followUpStatus: query.followUpStatus || "",
    campaignName: query.campaignName || "",
    packageName: query.packageName || "",
    dateFrom: query.dateFrom || "",
    dateTo: query.dateTo || "",
    exportType: query.exportType || "",
  };
}

export async function sponsorshipDashboard(req, res) {
  try {
    const { getSponsorshipDashboardStats } = await import("../services/adminSponsorshipService.js");
    const stats = await getSponsorshipDashboardStats();
    return res.status(200).json({ stats });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listSponsorships(req, res) {
  try {
    const { listSponsorships } = await import("../services/adminSponsorshipService.js");
    const sponsorships = await listSponsorships(parseFilters(req.query));
    return res.status(200).json({ sponsorships });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getSponsorship(req, res) {
  try {
    const { getSponsorshipById } = await import("../services/adminSponsorshipService.js");
    const detail = await getSponsorshipById(req.params.id);
    return res.status(200).json(detail);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createSponsorship(req, res) {
  try {
    const { createSponsorship } = await import("../services/adminSponsorshipService.js");
    const sponsorship = await createSponsorship(req.body || {}, req.admin?.id || req.admin?._id);
    return res.status(201).json({ sponsorship });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateSponsorship(req, res) {
  try {
    const { updateSponsorship } = await import("../services/adminSponsorshipService.js");
    const sponsorship = await updateSponsorship(
      req.params.id,
      req.body || {},
      req.admin?.id || req.admin?._id
    );
    return res.status(200).json({ sponsorship });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteSponsorship(req, res) {
  try {
    const { deleteSponsorship } = await import("../services/adminSponsorshipService.js");
    const result = await deleteSponsorship(req.params.id, req.admin?.id || req.admin?._id);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function sendReminder(req, res) {
  try {
    const { sendSponsorshipReminder } = await import("../services/adminSponsorshipService.js");
    const sponsorship = await sendSponsorshipReminder(
      req.params.id,
      req.admin?.id || req.admin?._id,
      req.body || {}
    );
    return res.status(200).json({ sponsorship });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function resendReceipt(req, res) {
  try {
    const { resendSponsorshipReceipt } = await import("../services/adminSponsorshipService.js");
    const sponsorship = await resendSponsorshipReceipt(req.params.id, req.admin?.id || req.admin?._id);
    return res.status(200).json({ sponsorship });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function downloadReceipt(req, res) {
  try {
    const { downloadSponsorshipReceipt } = await import("../services/adminSponsorshipService.js");
    const { pdf, filename } = await downloadSponsorshipReceipt(req.params.id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(pdf);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function downloadInvoice(req, res) {
  try {
    const { downloadSponsorshipInvoice } = await import("../services/adminSponsorshipService.js");
    const { pdf, filename } = await downloadSponsorshipInvoice(req.params.id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(pdf);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function markPaid(req, res) {
  try {
    const { markSponsorshipPaid } = await import("../services/adminSponsorshipService.js");
    const sponsorship = await markSponsorshipPaid(
      req.params.id,
      req.admin?.id || req.admin?._id,
      req.body || {}
    );
    return res.status(200).json({ sponsorship });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function markOverdue(req, res) {
  try {
    const { markSponsorshipOverdue } = await import("../services/adminSponsorshipService.js");
    const sponsorship = await markSponsorshipOverdue(req.params.id, req.admin?.id || req.admin?._id);
    return res.status(200).json({ sponsorship });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function exportSponsorships(req, res) {
  try {
    const { exportSponsorships } = await import("../services/adminSponsorshipService.js");
    const csv = await exportSponsorships(parseFilters(req.query));
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="sponsorships-export.csv"');
    return res.send(csv);
  } catch (error) {
    return handleError(res, error);
  }
}
