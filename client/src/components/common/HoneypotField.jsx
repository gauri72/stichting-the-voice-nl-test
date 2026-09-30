import { useRef } from "react";

/**
 * Anti-bot fields for plain-HTML public forms (contact/volunteer/quote).
 * `website` is a decoy input real users never see or fill — bots that
 * blindly fill every field in the DOM trip it. `formRenderedAt` lets the
 * server reject submissions that arrive faster than a human could plausibly
 * fill the form. Both are read server-side straight off req.body since they
 * post via FormData like every other field in these forms — see
 * contactController.js's isLikelyBotSubmission().
 */
export default function HoneypotField() {
  const renderedAtRef = useRef(Date.now());

  return (
    <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
      <label htmlFor="website">Website</label>
      <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
      <input type="hidden" name="formRenderedAt" defaultValue={renderedAtRef.current} />
    </div>
  );
}
