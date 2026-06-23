/** Event operations — inventory, technical rider, stage plan, documents, checklists. */

export const INVENTORY_CATEGORIES = [
  "Sound",
  "Lighting",
  "Stage",
  "Decoration",
  "Furniture",
  "Food & Beverage",
  "Tickets / Wristbands",
  "Branding",
  "Signage",
  "Photography / Videography",
  "Security",
  "Cleaning",
  "Venue",
  "Miscellaneous",
];

export const INVENTORY_STATUSES = [
  "Needed",
  "Requested",
  "Confirmed",
  "Delivered",
  "In Use",
  "Returned",
  "Damaged",
  "Missing",
  "Cancelled",
];

export const GLOBAL_INVENTORY_OWNERSHIP = ["Owned", "Rented", "Borrowed"];

export const GLOBAL_INVENTORY_STATUSES = ["Available", "In Use", "Maintenance", "Retired"];

export const TECHNICAL_RIDER_SECTIONS = [
  "Sound",
  "Lighting",
  "Stage",
  "Video / Visuals",
  "Power",
  "Staff",
];

export const TECHNICAL_RIDER_STATUSES = ["Needed", "Requested", "Confirmed", "Delivered", "Complete"];

export const STAGE_ELEMENT_TYPES = [
  "Stage",
  "DJ booth",
  "Microphone",
  "Speakers",
  "Monitors",
  "Lights",
  "Projector",
  "Screen",
  "Seating",
  "Tables",
  "Dance floor",
  "Entry/exit",
  "Bar",
  "Food station",
  "Camera position",
  "Decoration",
  "Sponsor banner",
  "V.O.I.C.E. NL branding",
  "Emergency exit",
  "Label",
];

export const DOCUMENT_CATEGORIES = [
  "Contract",
  "Invoice",
  "Receipt",
  "Agreement",
  "Permit",
  "Technical",
  "Stage Plan",
  "Budget",
  "Marketing",
  "Guest List",
  "Sponsor",
  "Vendor",
  "Internal",
  "Other",
];

export const DOCUMENT_VISIBILITY = ["Internal", "Team", "Finance", "Public Link"];

export const CHECKLIST_STATUSES = ["Open", "In Progress", "Done", "Blocked"];

export const CHECKLIST_CATEGORIES = [
  "Venue",
  "Sound",
  "Lighting",
  "Stage",
  "Sponsorship",
  "Tickets",
  "Volunteers",
  "Food",
  "Photography",
  "Budget",
  "Marketing",
  "Other",
];

export const OPERATIONS_STATUS_VALUES = ["not_started", "in_progress", "complete", "needs_attention"];

export const ALLOWED_DOCUMENT_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
];

export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_STAGE_IMAGE_SIZE = 8 * 1024 * 1024;

export const OPERATIONS_AUDIT_ACTIONS = {
  DOCUMENT_UPLOAD: "operations.document.upload",
  DOCUMENT_DOWNLOAD: "operations.document.download",
  DOCUMENT_DELETE: "operations.document.delete",
  DOCUMENT_RESTORE: "operations.document.restore",
  EXPORT: "operations.export",
};
