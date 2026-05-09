import nodemailer from "nodemailer";
import env from "../config/env.js";

let transporter = null;

function buildTransporter() {
  if (!env.email.host || !env.email.user || !env.email.pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.email.host,
    port: env.email.port,
    secure: env.email.secure,
    auth: {
      user: env.email.user,
      pass: env.email.pass
    }
  });
}

function getTransporter() {
  if (transporter) return transporter;
  transporter = buildTransporter();
  return transporter;
}

export function isMailerConfigured() {
  return Boolean(env.email.host && env.email.user && env.email.pass && env.email.from);
}

function formatAmount(amountMinor, currency) {
  const value = Number(amountMinor || 0) / 100;
  try {
    return new Intl.NumberFormat("en-IE", {
      style: "currency",
      currency: (currency || env.stripe.currency || "eur").toUpperCase()
    }).format(value);
  } catch (_error) {
    return `${(currency || env.stripe.currency || "eur").toUpperCase()} ${value.toFixed(2)}`;
  }
}

function buildSponsorEmail({ sponsor, tier, amountMinor, currency, paymentIntentId }) {
  const prettyAmount = formatAmount(amountMinor, currency);
  const tierName = tier?.name || "Sponsorship";

  const text = `Dear ${sponsor.firstName || sponsor.name || "Sponsor"},

Thank you for becoming a ${tierName} of Stichting The V.O.I.C.E. NL!

Your contribution of ${prettyAmount} has been received successfully.

Payment reference: ${paymentIntentId}

Together, we celebrate creativity, diversity, and harmony through art and culture. Your support directly enables our cultural events, community programs, and outreach.

Our team will reach out shortly with onboarding details, a sponsorship pack, and any benefits applicable to your tier.

With gratitude,
Team Stichting The V.O.I.C.E. NL
`;

  const html = `<!doctype html>
<html>
  <body style="font-family:Arial,Helvetica,sans-serif;background:#f5f8fb;margin:0;padding:24px;color:#1d3550;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 8px 24px rgba(10,47,69,0.08);">
      <tr>
        <td style="background:linear-gradient(90deg,#1b7d8f 0%,#1f9f78 100%);color:#ffffff;padding:28px 28px 22px;">
          <h1 style="margin:0;font-size:22px;letter-spacing:0.02em;">Thank You, ${sponsor.firstName || sponsor.name || "Sponsor"}!</h1>
          <p style="margin:8px 0 0;font-size:14px;opacity:0.92;">Your sponsorship makes our mission possible.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:26px 28px 8px;">
          <p style="margin:0 0 14px;font-size:15px;line-height:1.55;">
            We have received your contribution as <strong>${tierName}</strong>.
            We are honoured to count you among our supporters.
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8ef;border-radius:10px;margin:16px 0;">
            <tr>
              <td style="padding:14px 16px;border-bottom:1px solid #eef1f5;">
                <span style="font-size:12px;color:#6b7c8e;text-transform:uppercase;letter-spacing:0.05em;">Tier</span><br/>
                <strong style="font-size:15px;color:#17314b;">${tierName}</strong>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 16px;border-bottom:1px solid #eef1f5;">
                <span style="font-size:12px;color:#6b7c8e;text-transform:uppercase;letter-spacing:0.05em;">Amount</span><br/>
                <strong style="font-size:18px;color:#218f69;">${prettyAmount}</strong>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 16px;">
                <span style="font-size:12px;color:#6b7c8e;text-transform:uppercase;letter-spacing:0.05em;">Payment reference</span><br/>
                <code style="font-size:13px;color:#17314b;">${paymentIntentId}</code>
              </td>
            </tr>
          </table>
          <p style="margin:0 0 14px;font-size:14px;line-height:1.55;color:#4f6070;">
            Our team will be in touch shortly with your sponsorship pack and the next steps for your tier benefits.
          </p>
          <p style="margin:0;font-size:14px;line-height:1.55;color:#4f6070;">
            With gratitude,<br/>
            <strong style="color:#17314b;">Team Stichting The V.O.I.C.E. NL</strong>
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:18px 28px 26px;color:#7c8a99;font-size:12px;line-height:1.5;">
          Together, we celebrate creativity, diversity, and harmony through art and culture.<br/>
          &copy; ${new Date().getFullYear()} Stichting The V.O.I.C.E. NL.
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { text, html };
}

function buildOrgNotificationEmail({ sponsor, tier, amountMinor, currency, paymentIntentId }) {
  const prettyAmount = formatAmount(amountMinor, currency);
  const tierName = tier?.name || "Sponsorship";

  const text = `New sponsorship received

Tier: ${tierName}
Amount: ${prettyAmount}
Payment Intent: ${paymentIntentId}

Sponsor:
- Name: ${sponsor.name || `${sponsor.firstName || ""} ${sponsor.lastName || ""}`.trim()}
- Email: ${sponsor.email}
- Phone: ${sponsor.phone || "-"}
- Organization: ${sponsor.organization || "-"}
- Country: ${sponsor.country || "-"}
- Message: ${sponsor.message || "-"}
`;

  return { text, html: `<pre style="font-family:monospace;">${text}</pre>` };
}

export async function sendSponsorshipEmails(payload) {
  const tx = getTransporter();
  if (!tx || !env.email.from) {
    console.warn("[mailer] Email not sent: SMTP/EMAIL_FROM not configured.");
    return { skipped: true };
  }

  const sponsorMail = buildSponsorEmail(payload);
  const orgMail = buildOrgNotificationEmail(payload);

  const tasks = [
    tx.sendMail({
      from: env.email.from,
      to: payload.sponsor.email,
      subject: `Thank you for sponsoring Stichting The V.O.I.C.E. NL (${payload.tier?.name || "Sponsorship"})`,
      text: sponsorMail.text,
      html: sponsorMail.html
    })
  ];

  if (env.email.orgNotify) {
    tasks.push(
      tx.sendMail({
        from: env.email.from,
        to: env.email.orgNotify,
        subject: `New sponsorship: ${payload.tier?.name || "Sponsorship"} - ${formatAmount(
          payload.amountMinor,
          payload.currency
        )}`,
        text: orgMail.text,
        html: orgMail.html
      })
    );
  }

  await Promise.allSettled(tasks);
  return { skipped: false };
}
