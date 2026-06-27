import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { IconWalletOff, IconHistory, IconSettings, IconHome2, IconArrowLeft } from "@tabler/icons-react";
import { TopUp } from "../../icons/icons/index.js";
import { getStripePromise } from "../../../utils/stripeClient.js";
import { isPaymentReturnUrl, completePaymentReturn } from "../../../utils/stripePayment.js";
import { useWallet } from "../../../contexts/WalletContext.jsx";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import WalletCard from "./WalletCard.jsx";
import LowBalanceAlert from "./LowBalanceAlert.jsx";
import PointsProgressBar from "./PointsProgressBar.jsx";
import TransactionHistoryList from "./TransactionHistoryList.jsx";
import WalletSettingsPanel from "./WalletSettingsPanel.jsx";
import TopUpModal from "./TopUpModal.jsx";
import ConfettiBurst from "./ConfettiBurst.jsx";

const TABS = [
  { id: "overview", label: "Overview", icon: IconHome2 },
  { id: "history", label: "History", icon: IconHistory },
  { id: "settings", label: "Settings", icon: IconSettings },
];

export default function WalletPage() {
  const { wallet, transactions, loadWallet, loadTransactions, error } = useWallet();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [prevPoints, setPrevPoints] = useState(null);
  const [handlingReturn, setHandlingReturn] = useState(false);
  const [returnNotice, setReturnNotice] = useState("");

  useEffect(() => {
    loadWallet();
    loadTransactions();
  }, [loadWallet, loadTransactions]);

  const handleReturnSuccess = useCallback(async () => {
    // The actual crediting happens server-side (the webhook, or
    // reconcilePendingTopUps() as a fallback inside GET /api/wallet) — this
    // just needs to refresh so the now-correct balance shows up.
    await loadWallet();
    await loadTransactions();
    setReturnNotice("Your top-up was received — your balance is now up to date.");
    setTimeout(() => setReturnNotice(""), 6000);
  }, [loadWallet, loadTransactions]);

  // Redirect-based methods (iDEAL, Bancontact) leave the page entirely to
  // authenticate, then land back here — TopUpModal's own state is gone by
  // then, so this has to live at the page level instead.
  useEffect(() => {
    const promise = getStripePromise();
    if (!promise || !isPaymentReturnUrl()) return;
    promise.then(async (stripe) => {
      if (!stripe) return;
      setHandlingReturn(true);
      await completePaymentReturn(stripe, {
        onSuccess: handleReturnSuccess,
        onError: (msg) => setReturnNotice(msg),
      });
      setHandlingReturn(false);
    });
  }, [handleReturnSuccess]);

  useEffect(() => {
    if (!wallet) return;
    if (prevPoints !== null && wallet.rewardPoints > prevPoints && wallet.rewardPoints % 100 < (wallet.rewardPoints - prevPoints)) {
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 1000);
    }
    setPrevPoints(wallet.rewardPoints);
  }, [wallet?.rewardPoints]);

  if (!wallet) {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-10 text-center text-slate-400" style={{ paddingTop: "clamp(72px, 10vw, 96px)" }}>
        Loading your wallet…
      </div>
    );
  }

  if (!wallet.enabled) {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-16 text-center text-slate-400" style={{ paddingTop: "clamp(72px, 10vw, 96px)" }}>
        <IconWalletOff size={40} className="mx-auto mb-3 text-slate-600" />
        <p className="mb-4">V.Wallet is currently unavailable. Please check back later.</p>
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition hover:text-slate-200">
          <IconArrowLeft size={16} /> Back to My Account
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-6 sm:px-6" style={{ paddingTop: "clamp(72px, 10vw, 96px)" }}>
      <Link
        to="/dashboard"
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition hover:text-slate-200"
      >
        <IconArrowLeft size={16} /> Back to My Account
      </Link>
      <h1 className="mb-1 text-xl font-bold text-white">V.Wallet</h1>
      <p className="mb-5 text-sm text-slate-400">Top up, earn reward points, and let V.Assist book for you.</p>

      {error && <p className="mb-4 rounded-lg bg-red-950/50 px-3 py-2 text-sm text-red-300" role="alert">{error}</p>}
      {handlingReturn && (
        <p className="mb-4 rounded-lg bg-purple-950/50 px-3 py-2 text-sm text-purple-200" role="status">Confirming your top-up…</p>
      )}
      {returnNotice && (
        <p className="mb-4 rounded-lg bg-emerald-950/50 px-3 py-2 text-sm text-emerald-300" role="status">{returnNotice}</p>
      )}

      <div className="relative mb-5">
        <WalletCard
          customerName={user ? `${user.firstName} ${user.lastName}` : ""}
          customerId={user?.id}
          balanceMinor={wallet.balanceMinor}
          rewardPoints={wallet.rewardPoints}
          lowBalance={wallet.lowBalance}
        />
        <ConfettiBurst active={celebrate} />
      </div>

      <button
        type="button"
        onClick={() => setTopUpOpen(true)}
        className="mb-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-900/30 transition active:scale-95"
      >
        <TopUp className="h-5 w-5" aria-hidden="true" /> Top up V.Wallet
      </button>

      {wallet.lowBalance && (
        <div className="mb-5">
          <LowBalanceAlert onTopUp={() => setTopUpOpen(true)} />
        </div>
      )}

      <nav className="mb-5 flex gap-1 overflow-x-auto rounded-xl bg-slate-900/60 p-1 ring-1 ring-white/10" aria-label="Wallet sections">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
              activeTab === id ? "bg-gradient-to-r from-purple-600 to-cyan-500 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </nav>

      <div className="rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-black p-5 ring-1 ring-white/10">
        {activeTab === "overview" && (
          <div className="space-y-5">
            <PointsProgressBar
              points={wallet.rewardPoints}
              minRedemptionPoints={wallet.pointsProgram.minRedemptionPoints}
              pointsNeededPerEuroDiscount={wallet.pointsProgram.pointsNeededPerEuroDiscount}
            />
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Recent activity</h3>
              <TransactionHistoryList transactions={transactions.slice(0, 5)} />
            </div>
          </div>
        )}
        {activeTab === "history" && <TransactionHistoryList transactions={transactions} />}
        {activeTab === "settings" && <WalletSettingsPanel />}
      </div>

      <AnimatePresence>{topUpOpen && <TopUpModal onClose={() => setTopUpOpen(false)} />}</AnimatePresence>
    </div>
  );
}
