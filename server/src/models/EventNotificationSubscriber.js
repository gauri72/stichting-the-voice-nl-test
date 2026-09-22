import mongoose from "mongoose";

/**
 * A teammate who wants a de-identified email whenever a ticket is booked for
 * one of their subscribed events — see eventNotificationSubscriberService.js.
 * Deliberately GDPR-safe: the notification this feeds never includes the
 * buyer's name/email/phone, only aggregate order/event figures.
 */
const eventNotificationSubscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    eventIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
  },
  { timestamps: true, collection: "event_notification_subscribers" }
);

const EventNotificationSubscriber =
  mongoose.models.EventNotificationSubscriber ||
  mongoose.model("EventNotificationSubscriber", eventNotificationSubscriberSchema);

export default EventNotificationSubscriber;
