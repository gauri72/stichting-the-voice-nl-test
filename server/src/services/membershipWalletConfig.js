import env from "../config/env.js";

export function isAppleWalletConfigured() {
  const apple = env.wallet.apple;
  return Boolean(
    apple.passTypeIdentifier &&
      apple.teamIdentifier &&
      apple.wwdrCertPath &&
      apple.signerCertPath &&
      apple.signerKeyPath,
  );
}

export function isGoogleWalletConfigured() {
  const google = env.wallet.google;
  return Boolean(google.issuerId && google.serviceAccountEmail && google.serviceAccountPrivateKey);
}
