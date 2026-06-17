import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import { PKPass } from "passkit-generator";
import env from "../config/env.js";
import Member from "../models/Member.js";
import User from "../models/User.js";
import { getMembershipPageForUser } from "./membershipService.js";
import {
  buildMembershipQrImageUrl,
  buildMembershipVerifyUrl,
} from "./membershipQrService.js";
import { planTierLabel } from "./membershipWalletShared.js";
import {
  isAppleWalletConfigured,
  isGoogleWalletConfigured,
} from "./membershipWalletConfig.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PASS_MODEL_DIR = path.join(__dirname, "..", "pass-templates", "voice-membership.pass");
const WALLET_ASSETS_DIR = path.join(__dirname, "..", "assets", "wallet");

function walletNotConfigured(message) {
  const error = new Error(message);
  error.status = 503;
  return error;
}

function formatWalletDate(value) {
  if (!value) return "";
  const parsed = value instanceof Date ? value : new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    })
      .format(parsed)
      .toUpperCase();
  }
  return String(value).toUpperCase();
}

function memberLevelLabel(planShort, planId) {
  const tier = planTierLabel(planId);
  if (tier) return tier.toUpperCase();
  const raw = String(planShort || "").trim();
  return raw ? raw.toUpperCase() : "MEMBER";
}

async function loadWalletAssets() {
  const [logo, icon] = await Promise.all([
    fs.readFile(path.join(WALLET_ASSETS_DIR, "logo.png")),
    fs.readFile(path.join(WALLET_ASSETS_DIR, "icon.png")),
  ]);
  return { logo, icon };
}

async function findMemberRecord(user, membershipCode) {
  const email = String(user.email || "").trim().toLowerCase();
  const queries = [{ userId: user._id }];
  if (email) queries.push({ email });
  if (membershipCode && membershipCode !== "—") {
    queries.push({ membershipId: membershipCode });
  }

  return Member.findOne({
    $or: queries,
    membershipStatus: "active",
  })
    .sort({ expiryDate: -1 })
    .lean();
}

export async function resolveWalletContext(safeUser) {
  const user = await User.findById(safeUser.id).lean();
  if (!user) {
    const error = new Error("User not found.");
    error.status = 404;
    throw error;
  }

  const membership = await getMembershipPageForUser(safeUser);
  if (!membership?.hasMembership || !membership.active?.isActive) {
    const error = new Error("An active membership is required for wallet passes.");
    error.status = 403;
    throw error;
  }

  const active = membership.active;
  const memberDoc = await findMemberRecord(user, active.membershipCode || active.membershipNumber);
  const verificationToken = memberDoc?.verificationToken || null;
  const verifyUrl = verificationToken
    ? buildMembershipVerifyUrl(verificationToken)
    : `${env.clientUrl}/dashboard#dash-membership-card`;
  const qrCodeUrl =
    memberDoc?.qrCodeUrl ||
    active.qrCodeUrl ||
    (verificationToken ? buildMembershipQrImageUrl(verificationToken) : null);

  return {
    user,
    membership,
    active,
    memberDoc,
    verifyUrl,
    qrCodeUrl,
    membershipCode: active.membershipCode || active.membershipNumber || memberDoc?.membershipId,
    memberSince: active.validFrom || formatWalletDate(memberDoc?.startDate),
    validUntil: active.validTo || formatWalletDate(memberDoc?.expiryDate),
    memberLevel: memberLevelLabel(active.planNameAccent || active.planName, active.planId),
    memberName: [user.firstName, user.lastName].filter(Boolean).join(" ") || "Member",
  };
}

async function readCertificate(filePath) {
  if (!filePath) return null;
  return fs.readFile(filePath);
}

export async function createAppleWalletPass(context) {
  if (!isAppleWalletConfigured()) {
    throw walletNotConfigured("Apple Wallet is not configured on this server.");
  }

  const apple = env.wallet.apple;
  const [wwdr, signerCert, signerKey, assets] = await Promise.all([
    readCertificate(apple.wwdrCertPath),
    readCertificate(apple.signerCertPath),
    readCertificate(apple.signerKeyPath),
    loadWalletAssets(),
  ]);

  const pass = await PKPass.from(
    {
      model: PASS_MODEL_DIR,
      certificates: {
        wwdr,
        signerCert,
        signerKey,
        signerKeyPassphrase: apple.signerKeyPassphrase || undefined,
      },
    },
    {
      serialNumber: String(context.membershipCode || context.user._id),
      passTypeIdentifier: apple.passTypeIdentifier,
      teamIdentifier: apple.teamIdentifier,
      organizationName: "Stichting The V.O.I.C.E. NL",
      description: "VOICE NL Membership Card",
      logoText: "VOICE NL",
    },
  );

  pass.addBuffer("icon.png", assets.icon);
  pass.addBuffer("logo.png", assets.logo);
  pass.type = "storeCard";
  pass.headerFields.push({
    key: "member_year",
    label: "MEMBER",
    value: String(new Date(context.active.validToIso || Date.now()).getUTCFullYear()),
  });
  pass.primaryFields.push({
    key: "membership_id",
    label: "MEMBER ID",
    value: context.membershipCode,
  });
  pass.secondaryFields.push({
    key: "member_level",
    label: "MEMBER LEVEL",
    value: context.memberLevel,
  });
  pass.auxiliaryFields.push({
    key: "member_since",
    label: "MEMBER SINCE",
    value: context.memberSince,
  });
  pass.backFields.push(
    {
      key: "valid_until",
      label: "VALID UNTIL",
      value: context.validUntil,
    },
    {
      key: "member_name",
      label: "MEMBER",
      value: context.memberName,
    },
    {
      key: "organization",
      label: "ORGANIZATION",
      value: "Stichting The V.O.I.C.E. NL",
    },
  );
  pass.setBarcodes({
    message: context.verifyUrl,
    format: "PKBarcodeFormatQR",
    messageEncoding: "iso-8859-1",
    altText: context.membershipCode,
  });

  return pass.getAsBuffer();
}

export async function createGoogleWalletSaveUrl(context) {
  if (!isGoogleWalletConfigured()) {
    throw walletNotConfigured("Google Wallet is not configured on this server.");
  }

  const google = env.wallet.google;
  const classId = `${google.issuerId}.${google.classSuffix}`;
  const objectId = `${google.issuerId}.${String(context.membershipCode).replace(/[^\w.-]+/g, "-")}`;
  const logoUrl = `${env.publicApiUrl}/assets/wallet/logo.png`;

  const genericClass = {
    id: classId,
    issuerName: "Stichting The V.O.I.C.E. NL",
    reviewStatus: "UNDER_REVIEW",
    hexBackgroundColor: "#050505",
    logo: {
      sourceUri: { uri: logoUrl },
      contentDescription: {
        defaultValue: { language: "en-US", value: "VOICE NL logo" },
      },
    },
    classTemplateInfo: {
      cardTemplateOverride: {
        cardRowTemplateInfos: [
          {
            twoItems: {
              startItem: {
                firstValue: {
                  fields: [{ fieldPath: "object.textModulesData['member_since']" }],
                },
              },
              endItem: {
                firstValue: {
                  fields: [{ fieldPath: "object.textModulesData['member_level']" }],
                },
              },
            },
          },
        ],
      },
    },
  };

  const genericObject = {
    id: objectId,
    classId,
    state: "ACTIVE",
    hexBackgroundColor: "#050505",
    cardTitle: {
      defaultValue: { language: "en-US", value: "VOICE NL Membership" },
    },
    subheader: {
      defaultValue: { language: "en-US", value: context.memberLevel },
    },
    header: {
      defaultValue: { language: "en-US", value: context.membershipCode },
    },
    barcode: {
      type: "QR_CODE",
      value: context.verifyUrl,
      alternateText: context.membershipCode,
    },
    textModulesData: [
      {
        id: "member_since",
        header: "MEMBER SINCE",
        body: context.memberSince,
      },
      {
        id: "member_level",
        header: "MEMBER LEVEL",
        body: context.memberLevel,
      },
      {
        id: "valid_until",
        header: "VALID UNTIL",
        body: context.validUntil,
      },
    ],
  };

  const claims = {
    iss: google.serviceAccountEmail,
    aud: "google",
    origins: [env.clientUrl.replace(/\/$/, "")],
    typ: "savetowallet",
    payload: {
      genericClasses: [genericClass],
      genericObjects: [genericObject],
    },
  };

  const token = jwt.sign(claims, google.serviceAccountPrivateKey, {
    algorithm: "RS256",
  });

  return `https://pay.google.com/gp/v/save/${token}`;
}
