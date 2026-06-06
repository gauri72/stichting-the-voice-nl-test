import Member from "../models/Member.js";
import { generateMembershipQrPngBuffer } from "../services/membershipQrService.js";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(date) {
  if (!date) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(new Date(date));
  } catch {
    return "—";
  }
}

function renderVerifyPage({ found, valid, status, memberName, membershipId, membershipType, validUntil }) {
  const accent = !found ? "#b42318" : valid ? "#067647" : "#b54708";
  const heading = !found
    ? "Membership not found"
    : valid
      ? "Valid membership"
      : `Membership ${status}`;
  const icon = !found ? "&#10007;" : valid ? "&#10003;" : "&#33;";

  const detailRows = found
    ? `
      <div class="row"><span>Member</span><strong>${escapeHtml(memberName)}</strong></div>
      <div class="row"><span>Membership ID</span><strong>${escapeHtml(membershipId)}</strong></div>
      <div class="row"><span>Type</span><strong>${escapeHtml(membershipType)}</strong></div>
      <div class="row"><span>Valid Until</span><strong>${escapeHtml(formatDate(validUntil))}</strong></div>`
    : `<p class="muted">This QR code does not match any active membership in our records.</p>`;

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Membership Verification — Stichting The V.O.I.C.E. NL</title>
<style>
  body { margin:0; font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif; background:#f6f1e8; color:#06152f; }
  .wrap { max-width:440px; margin:48px auto; padding:0 16px; }
  .card { background:#fff; border-radius:16px; box-shadow:0 10px 30px rgba(16,24,40,.12); overflow:hidden; }
  .head { background:#0b2447; color:#fff; padding:28px 24px; text-align:center; }
  .badge { width:64px; height:64px; line-height:64px; border-radius:50%; background:${accent}; color:#fff; font-size:30px; margin:0 auto 12px; }
  .head h1 { margin:0; font-size:20px; }
  .head p { margin:6px 0 0; font-size:13px; color:#c7d3e6; }
  .body { padding:22px 24px 26px; }
  .row { display:flex; justify-content:space-between; gap:12px; padding:11px 0; border-bottom:1px solid #eef0f3; font-size:14px; }
  .row:last-child { border-bottom:0; }
  .row span { color:#5a6d82; }
  .muted { color:#5a6d82; font-size:14px; }
  .foot { text-align:center; font-size:12px; color:#8a97a8; margin-top:18px; }
</style></head>
<body><div class="wrap"><div class="card">
  <div class="head"><div class="badge">${icon}</div><h1>${heading}</h1>
  <p>Stichting The V.O.I.C.E. NL membership verification</p></div>
  <div class="body">${detailRows}</div>
</div><p class="foot">© 2026 Stichting The V.O.I.C.E. NL</p></div></body></html>`;
}

export async function verifyMembership(req, res) {
  try {
    const token = String(req.params.token || "").trim();
    const wantsHtml = req.accepts(["json", "html"]) === "html";

    if (!token) {
      return res.status(400).json({ error: "Verification token is required." });
    }

    const member = await Member.findOne({ verificationToken: token })
      .select(
        "membershipId firstName lastName email membershipType startDate expiryDate membershipStatus"
      )
      .lean();

    if (!member) {
      if (wantsHtml) {
        return res.status(404).type("html").send(renderVerifyPage({ found: false }));
      }
      return res.status(404).json({ valid: false, error: "Membership not found." });
    }

    const now = new Date();
    const isExpired = member.expiryDate && new Date(member.expiryDate) < now;
    const status = isExpired ? "expired" : member.membershipStatus;
    const valid = status === "active";
    const memberName = `${member.firstName} ${member.lastName}`.trim();

    if (wantsHtml) {
      return res.status(200).type("html").send(
        renderVerifyPage({
          found: true,
          valid,
          status,
          memberName,
          membershipId: member.membershipId,
          membershipType: member.membershipType,
          validUntil: member.expiryDate
        })
      );
    }

    return res.status(200).json({
      valid,
      membershipId: member.membershipId,
      memberName,
      membershipType: member.membershipType,
      email: member.email,
      startDate: member.startDate,
      expiryDate: member.expiryDate,
      membershipStatus: status
    });
  } catch (error) {
    console.error("[membership] verifyMembership error:", error);
    return res.status(500).json({ error: "Unable to verify membership." });
  }
}

export async function getMembershipQr(req, res) {
  try {
    const raw = String(req.params.token || "").trim();
    const token = raw.replace(/\.png$/i, "");
    if (!token) {
      return res.status(400).json({ error: "Verification token is required." });
    }

    const buffer = await generateMembershipQrPngBuffer(token);
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.status(200).end(buffer);
  } catch (error) {
    console.error("[membership] getMembershipQr error:", error);
    return res.status(500).json({ error: "Unable to generate QR code." });
  }
}
