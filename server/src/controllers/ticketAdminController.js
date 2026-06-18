function handleError(res, error) {
  const status = error.status || 500;
  const message = error.message || "Something went wrong.";
  if (status >= 500) console.error("[admin-events]", error);
  return res.status(status).json({ error: message, ticket: error.ticket });
}

export async function listEvents(req, res) {
  try {
    const { listEvents } = await import("../services/eventService.js");
    const { listTicketTailorEventsForAdmin } = await import("../services/ticketTailorEventService.js");
    const [events, ticketTailor] = await Promise.all([
      listEvents({ admin: true }),
      listTicketTailorEventsForAdmin(),
    ]);

    const platformPublished = events.filter((e) => e.status === "published").length;
    const platformDraft = events.filter((e) => e.status === "draft").length;

    return res.status(200).json({
      events: events.map((e) => ({ ...e, source: "platform", readOnly: false })),
      ticketTailorEvents: ticketTailor.events,
      ticketTailorMeta: {
        source: ticketTailor.source,
        warning: ticketTailor.warning,
        total: ticketTailor.total,
        published: ticketTailor.published,
      },
      counts: {
        total: events.length + ticketTailor.events.length,
        published: platformPublished + (ticketTailor.published || 0),
        draft: platformDraft,
        platform: events.length,
        ticketTailor: ticketTailor.events.length,
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getEvent(req, res) {
  try {
    const { getEventById } = await import("../services/eventService.js");
    const event = await getEventById(req.params.id, { includeHiddenTypes: true });
    return res.status(200).json({ event });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createEvent(req, res) {
  try {
    const { createEvent } = await import("../services/eventService.js");
    const event = await createEvent(req.body, req.admin?.id);
    return res.status(201).json({ event });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateEvent(req, res) {
  try {
    const { updateEvent } = await import("../services/eventService.js");
    const event = await updateEvent(req.params.id, req.body);
    return res.status(200).json({ event });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function publishEvent(req, res) {
  try {
    const { publishEvent } = await import("../services/eventService.js");
    const event = await publishEvent(req.params.id);
    return res.status(200).json({ event });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function saveDraft(req, res) {
  try {
    const { saveEventDraft } = await import("../services/eventService.js");
    const event = await saveEventDraft(req.params.id);
    return res.status(200).json({ event });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteEvent(req, res) {
  try {
    const { deleteEvent } = await import("../services/eventService.js");
    const result = await deleteEvent(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listVouchers(req, res) {
  try {
    const { listVouchers } = await import("../services/voucherService.js");
    const vouchers = await listVouchers();
    return res.status(200).json({ vouchers });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createVoucher(req, res) {
  try {
    const { createVoucher } = await import("../services/voucherService.js");
    const voucher = await createVoucher(req.body, req.admin?.id);
    return res.status(201).json({ voucher });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateVoucher(req, res) {
  try {
    const { updateVoucher } = await import("../services/voucherService.js");
    const voucher = await updateVoucher(req.params.id, req.body);
    return res.status(200).json({ voucher });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteVoucher(req, res) {
  try {
    const { deleteVoucher } = await import("../services/voucherService.js");
    const result = await deleteVoucher(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listTickets(req, res) {
  try {
    const { listAdminTickets } = await import("../services/ticketAdminService.js");
    const { listTicketTailorTicketsForAdmin } = await import("../services/ticketTailorTicketService.js");
    const [platform, ticketTailor] = await Promise.all([
      listAdminTickets(req.query),
      listTicketTailorTicketsForAdmin(req.query),
    ]);

    return res.status(200).json({
      tickets: platform.tickets.map((t) => ({ ...t, source: "platform", readOnly: false })),
      ticketTailorTickets: ticketTailor.tickets,
      ticketTailorMeta: {
        source: ticketTailor.source,
        warning: ticketTailor.warning,
        total: ticketTailor.total,
        checkedIn: ticketTailor.checkedIn,
        revenue: ticketTailor.revenue,
      },
      counts: {
        platform: platform.total,
        ticketTailor: ticketTailor.total,
        total: platform.total + ticketTailor.total,
      },
      total: platform.total,
      page: platform.page,
      limit: platform.limit,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function ticketStats(req, res) {
  try {
    const { getTicketStats } = await import("../services/ticketAdminService.js");
    const { getTicketTailorTicketStats } = await import("../services/ticketTailorTicketService.js");
    const [stats, ticketTailor] = await Promise.all([getTicketStats(), getTicketTailorTicketStats()]);

    return res.status(200).json({
      stats: {
        ...stats,
        ticketTailor,
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateTicket(req, res) {
  try {
    const { updateAdminTicket } = await import("../services/ticketAdminService.js");
    const ticket = await updateAdminTicket(req.params.id, req.body, req.admin?.id);
    return res.status(200).json({ ticket });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function checkIn(req, res) {
  try {
    const { checkInTicket } = await import("../services/ticketAdminService.js");
    const token = req.body?.token || req.body?.verificationToken;
    if (!token?.trim()) {
      return res.status(400).json({ error: "QR verification token is required." });
    }
    const result = await checkInTicket(token.trim(), req.admin?.id);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function resendEmail(req, res) {
  try {
    const { resendTicketEmail } = await import("../services/ticketAdminService.js");
    const result = await resendTicketEmail(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function downloadTicketPdf(req, res) {
  try {
    const Ticket = (await import("../models/Ticket.js")).default;
    const ticket = await Ticket.findById(req.params.id).lean();
    if (!ticket) return res.status(404).json({ error: "Ticket not found." });
    const { getTicketPdfBuffer } = await import("../services/ticketAdminService.js");
    const buffer = await getTicketPdfBuffer(ticket.ticketNumber);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="ticket-${ticket.ticketNumber}.pdf"`);
    return res.send(buffer);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function exportCsv(req, res) {
  try {
    const { exportTicketsCsv } = await import("../services/ticketAdminService.js");
    const csv = await exportTicketsCsv(req.query);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="tickets-export.csv"');
    return res.send(csv);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function markCheckedIn(req, res) {
  try {
    const Ticket = (await import("../models/Ticket.js")).default;
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: "Ticket not found." });
    if (ticket.checkedIn) return res.status(409).json({ error: "Already checked in." });
    ticket.checkedIn = true;
    ticket.checkedInAt = new Date();
    ticket.checkedInBy = req.admin?.id || null;
    await ticket.save();
    const { formatTicket } = await import("../services/ticketOrderService.js");
    return res.status(200).json({ ticket: formatTicket(ticket) });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function markRefunded(req, res) {
  try {
    const Ticket = (await import("../models/Ticket.js")).default;
    const ticketDoc = await Ticket.findById(req.params.id);
    if (!ticketDoc) return res.status(404).json({ error: "Ticket not found." });
    const { updateAdminTicket } = await import("../services/ticketAdminService.js");
    const ticket = await updateAdminTicket(req.params.id, { status: "refunded" }, req.admin?.id);
    const TicketOrder = (await import("../models/TicketOrder.js")).default;
    await TicketOrder.findByIdAndUpdate(ticketDoc.orderId, { paymentStatus: "refunded" });
    return res.status(200).json({ ticket });
  } catch (error) {
    return handleError(res, error);
  }
}
