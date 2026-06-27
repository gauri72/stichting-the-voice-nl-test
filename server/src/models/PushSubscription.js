import mongoose from "mongoose";

const pushSubscriptionSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
  },
  { timestamps: true, collection: "ai_push_subscriptions" }
);

const PushSubscription = mongoose.models.PushSubscription || mongoose.model("PushSubscription", pushSubscriptionSchema);

export default PushSubscription;
