import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: "", trim: true, maxlength: 5000 },
    date: { type: Date, required: true },
    startTime: { type: String, required: true, trim: true, maxlength: 10 },
    endTime: { type: String, default: "", trim: true, maxlength: 10 },
    venueName: { type: String, required: true, trim: true, maxlength: 200 },
    venueAddress: { type: String, default: "", trim: true, maxlength: 500 },
    heroImage: { type: String, default: "" },
    bookingFeeMinor: { type: Number, default: 0, min: 0 },
    salesEnabled: { type: Boolean, default: true },
    featured: { type: Boolean, default: false, index: true },
    showOnHomePage: { type: Boolean, default: false, index: true },
    showOnEventsPage: { type: Boolean, default: false, index: true },
    featuredPriority: { type: Number, default: 100, min: 0 },
    featuredHeroImageUrl: { type: String, default: "" },
    featuredMobileImageUrl: { type: String, default: "" },
    featuredImageAlt: { type: String, default: "", maxlength: 300 },
    featuredTitle: { type: String, default: "", maxlength: 200 },
    featuredSubtitle: { type: String, default: "", maxlength: 300 },
    featuredDescription: { type: String, default: "", trim: true, maxlength: 2000 },
    featuredBadgeText: { type: String, default: "Featured Event", maxlength: 80 },
    featuredCtaText: { type: String, default: "Book Tickets", maxlength: 80 },
    featuredDisplayMode: {
      type: String,
      default: "Auto",
      enum: [
        "Auto",
        "Light",
        "Dark",
        "Cinematic",
        "Elegant",
        "Women-focused",
        "Cultural",
        "Concert/DJ",
        "Family/Community",
      ],
    },
    featuredTextAlignment: {
      type: String,
      default: "Left",
      enum: ["Left", "Center", "Right"],
    },
    featuredOverlayStrength: {
      type: String,
      default: "Medium",
      enum: ["Light", "Medium", "Strong"],
    },
    featuredImageFocusPosition: {
      type: String,
      default: "Center",
      enum: ["Center", "Top", "Bottom", "Left", "Right"],
    },
    aiSuggestedStyle: { type: mongoose.Schema.Types.Mixed, default: null },
    showOnDashboard: { type: Boolean, default: true, index: true },
    membershipIncluded: { type: Boolean, default: false },
    membershipDiscountEligible: { type: Boolean, default: true },
    checkoutSettings: {
      enableMemberDiscount: { type: Boolean, default: true },
      enableMembershipUpsell: { type: Boolean, default: true },
      allowInstantMembershipBenefit: { type: Boolean, default: true },
      allowMembershipTicketBundle: { type: Boolean, default: true },
      eligibleMembershipTypes: {
        type: [String],
        default: () => ["student", "privilegedSingle", "privilegedFamily", "premiumSingle", "premiumFamily"],
      },
      allowDiscountStacking: { type: Boolean, default: true },
      showPriceComparisonPreview: { type: Boolean, default: true },
    },
    category: { type: String, default: "Experience", trim: true, maxlength: 80 },
    archived: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: ["draft", "published", "cancelled"],
      default: "draft",
      index: true,
    },
    slug: { type: String, trim: true, maxlength: 220, index: true },
    showInMemorableMoments: { type: Boolean, default: true, index: true },
    highlightStatus: {
      type: String,
      default: "Coming Soon",
      enum: ["Coming Soon", "Video Available", "Hidden"],
      index: true,
    },
    youtubeHighlightUrl: { type: String, default: "", maxlength: 500 },
    youtubeVideoId: { type: String, default: "", maxlength: 20 },
    youtubeEmbedUrl: { type: String, default: "", maxlength: 500 },
    youtubeThumbnailUrl: { type: String, default: "", maxlength: 500 },
    highlightTitle: { type: String, default: "", maxlength: 200 },
    highlightSubtitle: { type: String, default: "", maxlength: 300 },
    highlightDescription: { type: String, default: "", trim: true, maxlength: 2000 },
    impactText: { type: String, default: "", trim: true, maxlength: 1000 },
    highlightThumbnailImageUrl: { type: String, default: "" },
    galleryUrl: { type: String, default: "", maxlength: 500 },
    featuredHighlight: { type: Boolean, default: false, index: true },
    highlightPriority: { type: Number, default: 100, min: 0 },
    highlightUpdatedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "events" }
);

eventSchema.index({ status: 1, date: 1 });
eventSchema.index({ featured: 1, showOnHomePage: 1, status: 1, date: 1 });
eventSchema.index({ featured: 1, showOnEventsPage: 1, status: 1, date: 1 });
eventSchema.index({ status: 1, date: -1, showInMemorableMoments: 1 });
eventSchema.index({ slug: 1 }, { unique: true, sparse: true });

const Event = mongoose.models.Event || mongoose.model("Event", eventSchema);

export default Event;
