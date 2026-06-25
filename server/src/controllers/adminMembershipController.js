import { handleError as handleErrorBase } from "../utils/handleError.js";

function handleError(res, error) {
  return handleErrorBase(res, error, { logTag: "[admin/memberships]" });
}

function parseFilters(query) {
  return {
    search: query.search || "",
    membershipType: query.membershipType || "",
    membershipStatus: query.membershipStatus || "",
    paymentStatus: query.paymentStatus || "",
    expiryFrom: query.expiryFrom || "",
    expiryTo: query.expiryTo || "",
    createdFrom: query.createdFrom || "",
    createdTo: query.createdTo || "",
    country: query.country || "",
    autoRenewal: query.autoRenewal || "",
    eventAttendance: query.eventAttendance || "",
    ticketPurchaser: query.ticketPurchaser || "",
  };
}

export async function membershipStats(req, res) {
  try {
    const { getMembershipStats } = await import("../services/adminMembershipService.js");
    const stats = await getMembershipStats();
    return res.status(200).json({ stats });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listMemberships(req, res) {
  try {
    const { listMemberships, MEMBERSHIP_TYPE_OPTIONS } = await import(
      "../services/adminMembershipService.js"
    );
    const memberships = await listMemberships(parseFilters(req.query));
    return res.status(200).json({ memberships, membershipTypes: MEMBERSHIP_TYPE_OPTIONS });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function exportMemberships(req, res) {
  try {
    const { listMemberships, membershipsToCsv } = await import(
      "../services/adminMembershipService.js"
    );
    const memberships = await listMemberships(parseFilters(req.query));
    const csv = membershipsToCsv(memberships);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="memberships-export.csv"');
    return res.send(csv);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getMembership(req, res) {
  try {
    const { getMembershipDetail } = await import("../services/adminMembershipService.js");
    const detail = await getMembershipDetail(req.params.id);
    return res.status(200).json(detail);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createMembership(req, res) {
  try {
    const { createMembership } = await import("../services/adminMembershipService.js");
    const member = await createMembership(req.body || {}, req.admin?.id || req.admin?._id);
    return res.status(201).json({ member });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateMembership(req, res) {
  try {
    const { updateMembership } = await import("../services/adminMembershipService.js");
    const member = await updateMembership(
      req.params.id,
      req.body || {},
      req.admin?.id || req.admin?._id
    );
    return res.status(200).json({ member });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteMembership(req, res) {
  try {
    const { deleteMembership } = await import("../services/adminMembershipService.js");
    const result = await deleteMembership(req.params.id, req.admin?.id || req.admin?._id);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function renewMembership(req, res) {
  try {
    const { renewMembership } = await import("../services/adminMembershipService.js");
    const member = await renewMembership(
      req.params.id,
      req.body || {},
      req.admin?.id || req.admin?._id
    );
    return res.status(200).json({ member });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function cancelMembership(req, res) {
  try {
    const { cancelMembership } = await import("../services/adminMembershipService.js");
    const member = await cancelMembership(req.params.id, req.admin?.id || req.admin?._id);
    return res.status(200).json({ member });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function resendMembershipEmail(req, res) {
  try {
    const { resendMembershipEmail } = await import("../services/adminMembershipService.js");
    const result = await resendMembershipEmail(req.params.id, req.admin?.id || req.admin?._id);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function regenerateMembershipQr(req, res) {
  try {
    const { regenerateMembershipQr } = await import("../services/adminMembershipService.js");
    const member = await regenerateMembershipQr(req.params.id, req.admin?.id || req.admin?._id);
    return res.status(200).json({ member });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function downloadMembershipCard(req, res) {
  try {
    const { getMembershipCardPdf } = await import("../services/adminMembershipService.js");
    const { buffer, filename } = await getMembershipCardPdf(
      req.params.id,
      req.admin?.id || req.admin?._id
    );
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(buffer);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function syncTicketTailor(req, res) {
  try {
    const { syncTicketTailorBookings } = await import(
      "../services/ticketTailorBookingSyncService.js"
    );
    const { syncTicketTailorPastData } = await import("../services/pastDataSyncService.js");
    const pastData = await syncTicketTailorPastData();
    const bookings = await syncTicketTailorBookings({
      adminId: req.admin?.id || req.admin?._id,
    });
    return res.status(200).json({
      ...bookings,
      pastDataEmails: pastData.emails,
      pastDataIssuedMemberships: pastData.issuedMemberships,
      pastDataOrders: pastData.orders,
    });
  } catch (error) {
    return handleError(res, error);
  }
}
