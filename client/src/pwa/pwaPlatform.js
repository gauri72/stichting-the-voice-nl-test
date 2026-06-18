export function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function isAndroidDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent || "");
}

export function isMobileDevice() {
  return isIosDevice() || isAndroidDevice();
}

export function isInAppBrowser() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /FBAN|FBAV|Instagram|Line\/|Twitter|LinkedInApp|Snapchat/i.test(ua);
}

export function getPwaInstallPlatform() {
  if (isIosDevice()) return "ios";
  if (isAndroidDevice()) return "android";
  return "desktop";
}

export function getPwaInstallSteps(variant = "site") {
  const appName = variant === "checkin" ? "Check-in" : "V.O.I.C.E.";

  if (isIosDevice()) {
    const inApp = isInAppBrowser();
    return {
      title: `Add ${appName} to Home Screen`,
      steps: inApp
        ? [
            "Tap the menu (⋯) or browser icon and choose \"Open in Safari\".",
            "In Safari, tap the Share button at the bottom.",
            'Choose "Add to Home Screen".',
            `Tap "Add" to place ${appName} on your home screen.`,
          ]
        : [
            "Use Safari for the best install experience on iPhone and iPad.",
            "Tap the Share button at the bottom of Safari.",
            'Choose "Add to Home Screen".',
            `Tap "Add" — the ${appName} icon will appear on your home screen.`,
          ],
      note:
        variant === "checkin"
          ? "Install from the /check-in page so the app opens directly to QR scanning."
          : null,
    };
  }

  if (isAndroidDevice()) {
    return {
      title: `Install ${appName} app`,
      steps: [
        "Use Chrome or Edge for the install prompt.",
        "Tap the browser menu (⋮) in the top right.",
        'Select "Install app" or "Add to Home screen".',
        "Confirm install when prompted.",
      ],
      note: "If you do not see Install app, try refreshing the page and scrolling a little first.",
    };
  }

  return {
    title: `Install ${appName} app`,
    steps: [
      "Use Chrome, Edge, or another Chromium-based browser.",
      'Click the install icon in the address bar, or open the browser menu and choose "Install".',
      "Confirm to add the app to your device.",
    ],
    note: null,
  };
}
