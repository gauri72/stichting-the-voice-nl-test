import { useTranslation } from "react-i18next";
import "../../styles/wallet-portion-control.css";

/**
 * Shared "redeem points / pay partly from V.Wallet balance" control for
 * donation, sponsorship, and membership checkout.
 *
 * Unlike the ticket flow, the order total isn't known client-side before
 * submission (custom amounts, and even fixed tiers only expose a formatted
 * display label, never a raw minor-unit amount) — so this only bounds the
 * wallet-portion input by the wallet's own balance, and the backend caps it
 * against the real amount due once known (walletSplitPaymentService.js's
 * applyPointsDiscount + capWalletPortion, applied in that order).
 */
export default function WalletPortionControl({
  wallet,
  pointsToRedeem,
  onPointsToRedeemChange,
  walletPortionMinor,
  onWalletPortionMinorChange,
  disabled = false,
}) {
  const { t } = useTranslation(["checkout"]);

  if (!wallet?.enabled) return null;

  const canRedeemPoints = wallet.rewardPoints >= wallet.pointsProgram.minRedemptionPoints;
  const hasBalance = wallet.balanceMinor > 0;
  if (!canRedeemPoints && !hasBalance) return null;

  return (
    <div className="wallet-portion-control">
      <div className="wallet-portion-control__head">
        <span className="wallet-portion-control__title">💳 {t("checkout:paymentBlock.wallet.title")}</span>
        {hasBalance ? (
          <span className="wallet-portion-control__balance">
            {t("checkout:paymentBlock.wallet.balance", { amount: (wallet.balanceMinor / 100).toFixed(2) })}
          </span>
        ) : null}
      </div>

      {canRedeemPoints ? (
        <label className="wallet-portion-control__row">
          <span>{t("checkout:paymentBlock.wallet.redeemPoints", { count: wallet.rewardPoints })}</span>
          <input
            type="number"
            min="0"
            max={wallet.rewardPoints}
            step={wallet.pointsProgram.minRedemptionPoints}
            value={pointsToRedeem}
            disabled={disabled}
            onChange={(event) => onPointsToRedeemChange(Math.max(0, Number(event.target.value)))}
          />
        </label>
      ) : null}

      {hasBalance ? (
        <label className="wallet-portion-control__row">
          <span>{t("checkout:paymentBlock.wallet.useBalance")}</span>
          <input
            type="number"
            min="0"
            max={(wallet.balanceMinor / 100).toFixed(2)}
            step="0.01"
            value={(walletPortionMinor / 100).toFixed(2)}
            disabled={disabled}
            onChange={(event) =>
              onWalletPortionMinorChange(Math.max(0, Math.round(Number(event.target.value) * 100)))
            }
          />
        </label>
      ) : null}

      <p className="wallet-portion-control__hint">{t("checkout:paymentBlock.wallet.hint")}</p>
    </div>
  );
}
