function handleError(res, error) {
  const status = error.status || 500;
  const message = error.message || "Something went wrong.";
  if (status >= 500) console.error("[events]", error);
  return res.status(status).json({ error: message });
}

export async function listPublishedEvents(req, res) {
  try {
    const { listEvents } = await import("../services/eventService.js");
    const events = await listEvents({ status: "published" });
    return res.status(200).json({ events });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getPublishedEvent(req, res) {
  try {
    const { getPublishedEventBySlugOrId } = await import("../services/eventService.js");
    const event = await getPublishedEventBySlugOrId(req.params.idOrSlug);
    return res.status(200).json({ event });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function validateVoucher(req, res) {
  try {
    const { validateVoucher, applyVoucherDiscount } = await import("../services/ticketPricingService.js");
    const voucher = await validateVoucher(req.body?.code, req.params.eventId);
    return res.status(200).json({
      valid: true,
      voucher: {
        code: voucher.code,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function quoteOrder(req, res) {
  try {
    const { quoteOrder } = await import("../services/ticketOrderService.js");
    const quote = await quoteOrder(req.params.eventId, {
      items: req.body?.items,
      voucherCode: req.body?.voucherCode,
      userId: req.user?.id || req.user?._id,
    });
    return res.status(200).json(quote);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function checkout(req, res) {
  try {
    const { createCheckout } = await import("../services/ticketOrderService.js");
    const result = await createCheckout(req.params.eventId, req.body, req.user?.id || req.user?._id);
    return res.status(201).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function confirmPayment(req, res) {
  try {
    const { completeOrderPayment } = await import("../services/ticketOrderService.js");
    const result = await completeOrderPayment(req.params.orderId, req.body?.paymentIntentId);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function confirmPaymentByIntent(req, res) {
  try {
    const { completeOrderPaymentByIntent } = await import("../services/ticketOrderService.js");
    const result = await completeOrderPaymentByIntent(req.body?.paymentIntentId);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getOrder(req, res) {
  try {
    const { getOrderForUser } = await import("../services/ticketOrderService.js");
    const result = await getOrderForUser(req.params.orderNumber, req.user?.id || req.user?._id);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function verifyTicket(req, res) {
  try {
    const Ticket = (await import("../models/Ticket.js")).default;
    const TicketOrder = (await import("../models/TicketOrder.js")).default;
    const Event = (await import("../models/Event.js")).default;
    const { formatTicket, formatOrder } = await import("../services/ticketOrderService.js");

    const ticket = await Ticket.findOne({ verificationToken: req.params.token }).lean();
    if (!ticket) {
      return res.status(404).json({ valid: false, error: "Ticket not found." });
    }

    const [order, event] = await Promise.all([
      TicketOrder.findById(ticket.orderId).lean(),
      Event.findById(ticket.eventId).lean(),
    ]);

    const accept = req.headers.accept || "";
    if (accept.includes("text/html")) {
      const statusColor = ticket.checkedIn ? "#f59e0b" : ticket.status === "valid" ? "#3ecf9a" : "#ef4444";
      const statusLabel = ticket.checkedIn
        ? "Already checked in"
        : ticket.status === "valid"
          ? "Valid ticket"
          : ticket.status;
      return res
        .status(200)
        .type("html")
        .send(`<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Ticket Verification</title></head><body style="font-family:system-ui;background:#06152f;color:#fff;padding:24px;max-width:480px;margin:0 auto;"><h1 style="color:#3ecf9a;">V.O.I.C.E. NL</h1><p style="color:${statusColor};font-weight:bold;">${statusLabel}</p><p><strong>${event?.title || "Event"}</strong></p><p>${ticket.attendeeName}</p><p>${ticket.ticketTypeName}</p><p style="color:#8a9bb5;font-size:13px;">${ticket.ticketNumber}</p></body></html>`);
    }

    return res.status(200).json({
      valid: ticket.status === "valid" && order?.paymentStatus === "paid",
      checkedIn: ticket.checkedIn,
      ticket: formatTicket(ticket),
      order: order ? formatOrder(order) : null,
      event: event
        ? {
            title: event.title,
            date: event.date,
            startTime: event.startTime,
            venueName: event.venueName,
          }
        : null,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function ticketQrImage(req, res) {
  try {
    const token = req.params.token.replace(/\.png$/i, "");
    const Ticket = (await import("../models/Ticket.js")).default;
    const ticket = await Ticket.findOne({ verificationToken: token }).select("_id").lean();
    if (!ticket) return res.status(404).send("Not found");
    const { generateTicketQrPngBuffer } = await import("../services/ticketQrService.js");
    const buffer = await generateTicketQrPngBuffer(token);
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.send(buffer);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function downloadPublicTicketPdf(req, res) {
  try {
    const { getTicketPdfBuffer } = await import("../services/ticketAdminService.js");
    const buffer = await getTicketPdfBuffer(req.params.ticketNumber);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="ticket-${req.params.ticketNumber}.pdf"`);
    return res.send(buffer);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function myOrders(req, res) {
  try {
    const { getUserOrders, getUserTickets } = await import("../services/ticketOrderService.js");
    const [orders, tickets] = await Promise.all([
      getUserOrders(req.user.id || req.user._id),
      getUserTickets(req.user.id || req.user._id),
    ]);
    return res.status(200).json({ orders, tickets });
  } catch (error) {
    return handleError(res, error);
  }
}
