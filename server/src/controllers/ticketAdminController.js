import { handleError as handleErrorBase } from "../utils/handleError.js";

function handleError(res, error) {
  return handleErrorBase(res, error, { logTag: "[admin-events]", extra: { ticket: error.ticket } });
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

export async function patchTicketType(req, res) {
  try {
    const { patchTicketType } = await import("../services/ticketTypeAdminService.js");
    const ticketType = await patchTicketType(req.params.eventId, req.params.ticketTypeId, req.body || {});
    return res.status(200).json({ ticketType });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function enableTicketTypeSales(req, res) {
  try {
    const { setTicketTypeSales } = await import("../services/ticketTypeAdminService.js");
    const ticketType = await setTicketTypeSales(req.params.eventId, req.params.ticketTypeId, true);
    return res.status(200).json({ ticketType });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function disableTicketTypeSales(req, res) {
  try {
    const { setTicketTypeSales } = await import("../services/ticketTypeAdminService.js");
    const ticketType = await setTicketTypeSales(req.params.eventId, req.params.ticketTypeId, false);
    return res.status(200).json({ ticketType });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function patchFeaturedFlags(req, res) {
  try {
    const { patchEventFeaturedFlags } = await import("../services/eventService.js");
    const event = await patchEventFeaturedFlags(req.params.id, req.body || {});
    return res.status(200).json({ event });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function generateFeaturedStyle(req, res) {
  try {
    const { getEventById } = await import("../services/eventService.js");
    const { generateFeaturedDisplayStyle } = await import("../services/featuredEventAiService.js");
    const event = await getEventById(req.params.id, { includeHiddenTypes: true });
    const suggestion = generateFeaturedDisplayStyle(event);
    return res.status(200).json({ suggestion });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function generateFeaturedImagePrompt(req, res) {
  try {
    const { getEventById } = await import("../services/eventService.js");
    const { generateFeaturedImagePrompt: buildPrompt } = await import("../services/featuredEventAiService.js");
    const event = await getEventById(req.params.id, { includeHiddenTypes: true });
    const prompt = buildPrompt(event);
    return res.status(200).json({ prompt });
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

export async function bulkGenerateVouchers(req, res) {
  try {
    const { bulkGenerateVouchers } = await import("../services/voucherService.js");
    const vouchers = await bulkGenerateVouchers(req.body, req.admin?.id);
    return res.status(201).json({ vouchers });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function exportVouchersCsv(req, res) {
  try {
    const { exportVouchersCsv } = await import("../services/voucherService.js");
    const csv = await exportVouchersCsv();
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=\"vouchers.csv\"");
    return res.status(200).send(csv);
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

export async function getTicketDetail(req, res) {
  try {
    const { getAdminTicketDetail } = await import("../services/ticketAdminService.js");
    const result = await getAdminTicketDetail(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function transferTicket(req, res) {
  try {
    const { transferAdminTicket } = await import("../services/ticketAdminService.js");
    const result = await transferAdminTicket(req.params.id, req.body, req.admin?.id);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function voidTicket(req, res) {
  try {
    const { voidAdminTicket } = await import("../services/ticketAdminService.js");
    const ticket = await voidAdminTicket(req.params.id, req.body || {}, req.admin?.id);
    return res.status(200).json({ ticket });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function sendTicketUpdate(req, res) {
  try {
    const { sendPendingTicketUpdate } = await import("../services/ticketAdminService.js");
    const result = await sendPendingTicketUpdate(
      req.params.id,
      req.body?.notificationId,
      req.admin?.id
    );
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function checkIn(req, res) {
  try {
    const token = req.body?.token || req.body?.verificationToken;
    if (!token?.trim()) {
      return res.status(400).json({ error: "QR verification token is required." });
    }
    const cleanToken = token.trim();
    try {
      const { checkInTicket } = await import("../services/ticketAdminService.js");
      const result = await checkInTicket(cleanToken, req.admin?.id);
      return res.status(200).json(result);
    } catch (primaryError) {
      if ((primaryError.status || 500) !== 404) throw primaryError;
      const { resolveSessionOrRsvpCheckIn } = await import("../services/sessionPlatformService.js");
      const fallback = await resolveSessionOrRsvpCheckIn(cleanToken, req.admin?.id);
      return res.status(200).json(fallback);
    }
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
    const { getTicketRevisionPdfBuffer } = await import("../services/ticketAdminService.js");
    const { buffer, ticketNumber, revision } = await getTicketRevisionPdfBuffer(
      req.params.id,
      req.params.documentId,
      req.admin?.id
    );
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="ticket-${ticketNumber}${revision ? `-revision-${revision}` : ""}.pdf"`
    );
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
    if (ticket.status !== "valid") {
      return res.status(409).json({ error: `A ${ticket.status} ticket cannot be checked in.` });
    }
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
    const wasAlreadyRefunded = ticketDoc.status === "refunded";

    const { updateAdminTicket } = await import("../services/ticketAdminService.js");
    const ticket = await updateAdminTicket(req.params.id, { status: "refunded" }, req.admin?.id);
    const TicketOrder = (await import("../models/TicketOrder.js")).default;
    await TicketOrder.findByIdAndUpdate(ticketDoc.orderId, { paymentStatus: "refunded" });

    // A refund frees up one unit of capacity on the ticket type — release it
    // back into soldCount and notify the next person on the waitlist, if any.
    // (Guarded so re-refunding an already-refunded ticket can't double-release.)
    if (!wasAlreadyRefunded && ticketDoc.seatId) {
      const { releaseSeatsFromOrder } = await import("../services/seatService.js");
      await releaseSeatsFromOrder({
        selectedSeats: [{ seatId: ticketDoc.seatId }],
        eventId: ticketDoc.eventId,
      }).catch((err) => console.error("[tickets] seat release failed:", err.message));
    }
    if (!wasAlreadyRefunded && ticketDoc.ticketTypeId) {
      const TicketType = (await import("../models/TicketType.js")).default;
      const ticketType = await TicketType.findOneAndUpdate(
        { _id: ticketDoc.ticketTypeId, soldCount: { $gt: 0 } },
        { $inc: { soldCount: -1 } },
        { new: true }
      );
      if (ticketType && ticketType.status === "sold_out" && ticketType.soldCount < ticketType.capacity) {
        ticketType.status = "active";
        await ticketType.save();
      }
      if (ticketType) {
        const { notifyWaitlistAvailability } = await import("../services/booking/WaitlistService.js");
        await notifyWaitlistAvailability({
          resourceType: "ticket_type",
          resourceId: ticketDoc.ticketTypeId.toString(),
        }).catch((err) => console.error("[tickets] waitlist notification failed:", err.message));
      }
    }

    return res.status(200).json({ ticket });
  } catch (error) {
    return handleError(res, error);
  }
}
