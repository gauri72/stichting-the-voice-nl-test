import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch, authHeaders } from "../utils/api.js";
import { buildKnownAnswersFromAttendee, autoPopulateValues } from "../utils/checkoutFormUtils.js";

const FLOW_API = "/api/booking";

/**
 * Unified booking flow hook — ticket, session, RSVP, waitlist, festival, complimentary.
 */
export default function useBookingFlow({
  flowType = "event_ticket",
  eventId = null,
  slug = null,
  items = [],
  attendee = {},
  reservedSeatingEnabled = false,
  enabled = true,
  email = "",
  sessionId: externalSessionId = "",
}) {
  const [flow, setFlow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState(externalSessionId || "");

  const knownAnswers = useMemo(() => buildKnownAnswersFromAttendee(attendee), [attendee]);

  useEffect(() => {
    if (externalSessionId) setSessionId(externalSessionId);
  }, [externalSessionId]);

  const resolveFlow = useCallback(async (overrides = {}) => {
    if (!enabled) return null;
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch(`${FLOW_API}/resolve`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          flowType,
          eventId,
          slug,
          items,
          email: email || attendee.email,
          knownAnswers,
          reservedSeatingEnabled,
          hideCollectedFields: true,
          sessionId,
          ...overrides,
        }),
      });
      setFlow(data);
      return data;
    } catch (err) {
      setError(err.message || "Failed to resolve booking flow.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [enabled, flowType, eventId, slug, items, email, attendee.email, knownAnswers, reservedSeatingEnabled, sessionId]);

  useEffect(() => {
    if (enabled && (eventId || slug)) resolveFlow();
  }, [enabled, eventId, slug, items.length, reservedSeatingEnabled]);

  const initSession = useCallback(async (payload = {}) => {
    const data = await apiFetch(`${FLOW_API}/${flowType}/start`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ eventId, slug, items, email: email || attendee.email, ...payload }),
    });
    if (data.sessionId) setSessionId(data.sessionId);
    return data;
  }, [flowType, eventId, slug, items, email, attendee.email]);

  const fetchPreview = useCallback(async (payload = {}) => {
    return apiFetch(`${FLOW_API}/${flowType}/preview`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        eventId,
        slug,
        items,
        sessionId,
        email: email || attendee.email,
        ...payload,
      }),
    });
  }, [flowType, eventId, slug, items, sessionId, email, attendee.email]);

  const checkout = useCallback(async (payload = {}) => {
    return apiFetch(`${FLOW_API}/${flowType}/checkout`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ eventId, slug, items, sessionId, ...payload }),
    });
  }, [flowType, eventId, slug, items, sessionId]);

  const confirm = useCallback(async (payload = {}) => {
    return apiFetch(`${FLOW_API}/${flowType}/confirm`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ eventId, slug, sessionId, ...payload }),
    });
  }, [flowType, eventId, slug, sessionId]);

  const detectMembership = useCallback(async (membershipCode = "") => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 10000);
    try {
      return await apiFetch(`${FLOW_API}/membership/detect`, {
        method: "POST",
        headers: authHeaders(),
        signal: controller.signal,
        body: JSON.stringify({
          email: email || attendee.email,
          membershipCode,
          eventId,
          sessionId,
        }),
      });
    } catch (err) {
      if (err?.name === "AbortError") {
        const timeoutError = new Error("Membership check timed out. Please try again.");
        timeoutError.status = 408;
        throw timeoutError;
      }
      throw err;
    } finally {
      window.clearTimeout(timer);
    }
  }, [email, attendee.email, eventId, sessionId]);

  const resolveForms = useCallback(async (payload = {}) => {
    return apiFetch(`${FLOW_API}/forms/resolve`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        eventId,
        ticketTypeIds: items.map((i) => i.ticketTypeId),
        items,
        ticketQuantity: items.reduce((s, i) => s + (i.quantity || 0), 0),
        knownAnswers,
        hideCollectedFields: true,
        ...payload,
      }),
    });
  }, [eventId, items, knownAnswers]);

  const validateForms = useCallback(async (payload = {}) => {
    return apiFetch(`${FLOW_API}/forms/validate`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
  }, []);

  const validateDiscountCode = useCallback(async (code, extra = {}) => {
    return apiFetch(`${FLOW_API}/discount/validate-code`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ code, eventId, sessionId, ...extra }),
    });
  }, [eventId, sessionId]);

  const validateMembershipCode = useCallback(async (code) => {
    return apiFetch(`${FLOW_API}/membership/validate-code`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ code, email: email || attendee.email, eventId, sessionId }),
    });
  }, [email, attendee.email, eventId, sessionId]);

  const saveBeforeLogin = useCallback(async (payload) => {
    return apiFetch(`${FLOW_API}/session/save-before-login`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ sessionId, eventId, ...payload }),
    });
  }, [sessionId, eventId]);

  const restoreSession = useCallback(async (sid) => {
    return apiFetch(`${FLOW_API}/session/${sid}`, { headers: authHeaders() });
  }, []);

  const applyBenefitsAfterLogin = useCallback(async (payload = {}) => {
    return apiFetch(`${FLOW_API}/session/apply-benefits-after-login`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ sessionId, eventId, email: email || attendee.email, ...payload }),
    });
  }, [sessionId, eventId, email, attendee.email]);

  const fetchMembershipPlans = useCallback(async (eid) => {
    return apiFetch(`${FLOW_API}/membership-plans/${eid || eventId}`, { headers: authHeaders() });
  }, [eventId]);

  const joinWaitlist = useCallback(async (payload) => {
    return apiFetch(`${FLOW_API}/waitlist`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
  }, []);

  const populateFormValues = useCallback(
    (fields, existing = {}) => autoPopulateValues(fields, knownAnswers, existing),
    [knownAnswers]
  );

  return {
    flow,
    sessionId,
    setSessionId,
    steps: flow?.steps || [],
    mode: flow?.mode,
    skipPayment: flow?.skipPayment,
    forms: flow?.forms,
    pricePreview: flow?.preview,
    features: flow?.features,
    loading,
    error,
    knownAnswers,
    resolveFlow,
    initSession,
    fetchPreview,
    checkout,
    confirm,
    detectMembership,
    resolveForms,
    validateForms,
    validateDiscountCode,
    validateMembershipCode,
    saveBeforeLogin,
    restoreSession,
    applyBenefitsAfterLogin,
    fetchMembershipPlans,
    joinWaitlist,
    populateFormValues,
  };
}
