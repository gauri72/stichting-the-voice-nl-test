import { createTicketPaymentIntent, confirmTicketPayment } from "../ticketPaymentService.js";
import { fulfillOrder } from "../postPaymentFulfillmentService.js";

export async function createPaymentSession(order) {
  return createTicketPaymentIntent({
    orderId: order._id?.toString() || order.id,
    orderNumber: order.orderNumber,
    amountMinor: order.grandTotalMinor,
    eventTitle: order.eventTitle || "",
    orderType: order.orderType || "TICKET_ONLY",
    includeMembership: Boolean(order.membershipItems?.length),
    membershipPlanId: order.membershipItems?.[0]?.planId || "",
  });
}

export async function confirmPayment({ orderId, paymentIntentId }) {
  await confirmTicketPayment(paymentIntentId);
  return fulfillOrder(orderId, paymentIntentId);
}

export async function completeFreeBooking(orderId) {
  return fulfillOrder(orderId, null, { isFreeOrder: true });
}
