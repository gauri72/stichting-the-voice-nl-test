/** Protected core field IDs — cannot be deleted on standard/system forms */
export const PROTECTED_CORE_FIELD_IDS = new Set([
  "first_name",
  "last_name",
  "email",
  "phone",
  "terms",
]);

function coreField(overrides) {
  return {
    isCore: true,
    isProtected: true,
    visibility: true,
    showInEmail: true,
    showInPdf: true,
    showInAdmin: true,
    showInCheckIn: true,
    conditionalLogic: [],
    options: [],
    repeatMode: "order",
    ...overrides,
  };
}

function customField(overrides) {
  return {
    isCore: false,
    isProtected: false,
    visibility: true,
    showInEmail: false,
    showInPdf: false,
    showInAdmin: true,
    showInCheckIn: false,
    conditionalLogic: [],
    options: [],
    repeatMode: "order",
    ...overrides,
  };
}

export const STANDARD_CHECKOUT_FORMS = [
  {
    formType: "basic_ticket",
    name: "Basic Ticket Checkout Form",
    description: "Standard checkout for general ticket purchases.",
    fields: [
      coreField({ fieldId: "first_name", label: "First Name", type: "text", placeholder: "Enter first name", required: true, order: 1 }),
      coreField({ fieldId: "last_name", label: "Last Name", type: "text", placeholder: "Enter last name", required: true, order: 2 }),
      coreField({ fieldId: "email", label: "Email", type: "email", placeholder: "name@email.com", required: true, order: 3, showInPdf: false }),
      coreField({ fieldId: "phone", label: "Phone Number", type: "phone", placeholder: "+31 ...", required: false, order: 4, showInEmail: false }),
      coreField({ fieldId: "terms", label: "Terms & Conditions", type: "consent", required: true, order: 5, showInEmail: false, showInPdf: false, showInCheckIn: false }),
    ],
  },
  {
    formType: "attendee",
    name: "Event Attendee Form",
    description: "Collect attendee details and dietary preferences.",
    fields: [
      coreField({ fieldId: "first_name", label: "First Name", type: "text", placeholder: "Enter first name", required: true, order: 1 }),
      coreField({ fieldId: "last_name", label: "Last Name", type: "text", placeholder: "Enter last name", required: true, order: 2 }),
      coreField({ fieldId: "email", label: "Email", type: "email", placeholder: "name@email.com", required: true, order: 3 }),
      coreField({ fieldId: "phone", label: "Phone Number", type: "phone", placeholder: "+31 ...", required: false, order: 4 }),
      customField({ fieldId: "attendee_name", label: "Attendee Name", type: "text", placeholder: "Name as shown on ticket", required: true, order: 5, showInEmail: true, showInPdf: true }),
      customField({
        fieldId: "dietary_preference",
        label: "Dietary Preference",
        type: "dropdown",
        options: ["None", "Vegetarian", "Vegan", "Halal", "Kosher", "Gluten-free", "Other"],
        required: false,
        order: 6,
      }),
      customField({ fieldId: "special_request", label: "Special Request", type: "textarea", placeholder: "Any special requirements?", required: false, order: 7 }),
    ],
  },
  {
    formType: "group_family",
    name: "Family / Group Ticket Form",
    description: "Checkout form for group and family ticket bookings.",
    fields: [
      coreField({ fieldId: "first_name", label: "First Name", type: "text", required: true, order: 1 }),
      coreField({ fieldId: "last_name", label: "Last Name", type: "text", required: true, order: 2 }),
      coreField({ fieldId: "email", label: "Email", type: "email", required: true, order: 3 }),
      coreField({ fieldId: "phone", label: "Phone Number", type: "phone", required: false, order: 4 }),
      customField({ fieldId: "lead_attendee_name", label: "Lead Attendee Name", type: "text", required: true, order: 5, showInEmail: true, showInPdf: true }),
      customField({ fieldId: "number_of_guests", label: "Number of Guests", type: "number", required: true, order: 6 }),
      customField({ fieldId: "guest_names", label: "Guest Names", type: "textarea", placeholder: "One name per line", required: false, order: 7, repeatMode: "participant_count" }),
      customField({
        fieldId: "dietary_preference",
        label: "Dietary Preference",
        type: "dropdown",
        options: ["None", "Vegetarian", "Vegan", "Halal", "Kosher", "Gluten-free", "Other"],
        required: false,
        order: 8,
      }),
      customField({ fieldId: "special_request", label: "Special Request", type: "textarea", required: false, order: 9 }),
    ],
  },
  {
    formType: "membership_aware",
    name: "Membership-Aware Ticket Form",
    description: "Checkout with membership and voucher code fields.",
    fields: [
      coreField({ fieldId: "first_name", label: "First Name", type: "text", required: true, order: 1 }),
      coreField({ fieldId: "last_name", label: "Last Name", type: "text", required: true, order: 2 }),
      coreField({ fieldId: "email", label: "Email", type: "email", required: true, order: 3 }),
      coreField({ fieldId: "phone", label: "Phone Number", type: "phone", required: false, order: 4 }),
      customField({ fieldId: "membership_code", label: "Membership Code", type: "text", placeholder: "Enter membership code", required: false, order: 5 }),
      customField({ fieldId: "voucher_code", label: "Voucher Code", type: "text", placeholder: "Enter voucher code", required: false, order: 6 }),
      coreField({ fieldId: "terms", label: "Terms & Conditions", type: "consent", required: true, order: 7, showInEmail: false, showInPdf: false }),
    ],
  },
  {
    formType: "rsvp",
    name: "RSVP Form",
    description: "RSVP response form for events.",
    fields: [
      customField({ fieldId: "full_name", label: "Full Name", type: "text", required: true, order: 1, showInEmail: true, showInPdf: true, isCore: true, isProtected: true }),
      coreField({ fieldId: "email", label: "Email", type: "email", required: true, order: 2 }),
      coreField({ fieldId: "phone", label: "Phone Number", type: "phone", required: false, order: 3 }),
      customField({
        fieldId: "rsvp_response",
        label: "RSVP Response",
        type: "radio",
        options: ["Attending", "Not Attending", "Maybe"],
        required: true,
        order: 4,
      }),
      customField({ fieldId: "number_of_guests", label: "Number of Guests", type: "number", required: false, order: 5 }),
      customField({ fieldId: "guest_names", label: "Guest Names", type: "textarea", required: false, order: 6 }),
      customField({
        fieldId: "food_preference",
        label: "Food Preference",
        type: "dropdown",
        options: ["None", "Vegetarian", "Vegan", "Halal", "Kosher", "Gluten-free"],
        required: false,
        order: 7,
      }),
      customField({ fieldId: "message_to_host", label: "Message to Host", type: "textarea", required: false, order: 8 }),
    ],
  },
  {
    formType: "session",
    name: "Session Booking Form",
    description: "Form for session and workshop bookings.",
    fields: [
      coreField({ fieldId: "first_name", label: "First Name", type: "text", required: true, order: 1 }),
      coreField({ fieldId: "last_name", label: "Last Name", type: "text", required: true, order: 2 }),
      coreField({ fieldId: "email", label: "Email", type: "email", required: true, order: 3 }),
      coreField({ fieldId: "phone", label: "Phone Number", type: "phone", required: false, order: 4 }),
      customField({ fieldId: "participant_name", label: "Participant Name", type: "text", required: true, order: 5, showInEmail: true, showInPdf: true }),
      customField({ fieldId: "health_notes", label: "Health Notes", type: "textarea", placeholder: "Allergies, medical conditions, etc.", required: false, order: 6 }),
      customField({ fieldId: "emergency_contact", label: "Emergency Contact", type: "text", placeholder: "Name and phone number", required: true, order: 7 }),
      coreField({ fieldId: "terms", label: "Terms & Conditions", type: "consent", required: true, order: 8, showInEmail: false, showInPdf: false }),
    ],
  },
];
