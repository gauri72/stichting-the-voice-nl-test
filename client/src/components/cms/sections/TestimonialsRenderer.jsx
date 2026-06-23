import EventsTestimonialsSection from "../../events/EventsTestimonialsSection.jsx";

export default function TestimonialsRenderer({ section }) {
  const variant = section.content?.variant || "community";
  return <EventsTestimonialsSection variant={variant} />;
}
