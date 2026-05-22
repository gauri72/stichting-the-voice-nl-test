import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOCIAL_DIR = path.join(__dirname, "..", "assets", "email", "social");

export const EMAIL_SOCIAL_URLS = {
  facebook: "https://www.facebook.com/p/The-VOICE-NL-61552129209396/",
  instagram: "https://www.instagram.com/stichting_the_voice_nl/?hl=en",
  youtube: "https://www.youtube.com/@StichtingTheVOICENL",
  linkedin: "https://www.linkedin.com/in/stichting-the-v-o-i-c-e-nl-b67427316/",
  x: "https://x.com/St_The_VOICE_NL"
};

const BRAND_ICON_FILES = [
  { key: "instagram", file: "instagram.png", cid: "voiceInstagramIcon", alt: "Instagram" },
  { key: "youtube", file: "youtube.png", cid: "voiceYoutubeIcon", alt: "YouTube" }
];

/** @returns {import("nodemailer").Attachment[]} */
export function loadEmailSocialIconAttachments() {
  const attachments = [];
  for (const icon of BRAND_ICON_FILES) {
    const filePath = path.join(SOCIAL_DIR, icon.file);
    try {
      if (!fs.existsSync(filePath)) continue;
      attachments.push({
        filename: icon.file,
        content: fs.readFileSync(filePath),
        cid: icon.cid,
        contentDisposition: "inline"
      });
    } catch {
      console.warn(`[mailer] Could not load ${icon.file} for email signature.`);
    }
  }
  return attachments;
}

/** @returns {{ instagram?: string, youtube?: string }} */
export function getEmailSocialIconCids() {
  const cids = {};
  for (const icon of BRAND_ICON_FILES) {
    if (fs.existsSync(path.join(SOCIAL_DIR, icon.file))) {
      cids[icon.key] = icon.cid;
    }
  }
  return cids;
}

function textSocialCell(label, href, bg, radius = "50%") {
  return `<td style="padding:0 4px 0 0;"><a href="${href}" style="display:inline-block;width:16px;height:16px;border-radius:${radius};background:${bg};color:#ffffff;text-decoration:none;text-align:center;line-height:16px;font-family:Arial,Helvetica,sans-serif;font-size:7px;font-weight:800;">${label}</a></td>`;
}

function imageSocialCell(href, cid, alt) {
  return `<td style="padding:0 4px 0 0;vertical-align:middle;">
    <a href="${href}" style="display:inline-block;line-height:0;text-decoration:none;" target="_blank" rel="noopener noreferrer">
      <img src="cid:${cid}" alt="${alt}" width="16" height="16" style="display:block;width:16px;height:16px;border:0;outline:none;" />
    </a>
  </td>`;
}

/**
 * Shared "Follow us" row for sponsorship and donation email footers.
 * @param {{ instagram?: string, youtube?: string }} iconCids
 */
export function buildEmailFollowUsRowHtml(iconCids = {}) {
  const ig = iconCids.instagram
    ? imageSocialCell(EMAIL_SOCIAL_URLS.instagram, iconCids.instagram, "Instagram")
    : textSocialCell("ig", EMAIL_SOCIAL_URLS.instagram, "#e4405f");
  const yt = iconCids.youtube
    ? imageSocialCell(EMAIL_SOCIAL_URLS.youtube, iconCids.youtube, "YouTube")
    : textSocialCell("yt", EMAIL_SOCIAL_URLS.youtube, "#ff0000");

  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:8px;border-spacing:0;">
                  <tr>
                    <td style="padding:0 8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:8px;font-weight:800;color:#10243a;vertical-align:middle;">
                      Follow us:
                    </td>
                    ${textSocialCell("f", EMAIL_SOCIAL_URLS.facebook, "#1877f2", "50%")}
                    ${ig}
                    ${yt}
                    ${textSocialCell("in", EMAIL_SOCIAL_URLS.linkedin, "#0a66c2")}
                    ${textSocialCell("x", EMAIL_SOCIAL_URLS.x, "#000000", "3px")}
                  </tr>
                </table>`;
}
