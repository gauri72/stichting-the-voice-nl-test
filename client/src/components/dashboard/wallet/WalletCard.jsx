import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { IconSparkles, IconRotate } from "@tabler/icons-react";
import { PayWallet } from "../../icons/icons/index.js";

function maskWalletId(customerId) {
  if (!customerId) return "•••• •••• ••••";
  const tail = customerId.slice(-4).toUpperCase();
  return `V.W •••• •••• ${tail}`;
}

function useCountUp(target, durationMs = 900) {
  const [value, setValue] = useState(target);
  const prevTarget = useRef(target);

  useEffect(() => {
    const from = prevTarget.current;
    const to = target;
    if (from === to) return;
    const start = performance.now();
    let frame;
    function tick(now) {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(from + (to - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    prevTarget.current = to;
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return value;
}

export default function WalletCard({ customerName, customerId, balanceMinor, rewardPoints, lowBalance, onFlip }) {
  const [flipped, setFlipped] = useState(false);
  const reduceMotion = useReducedMotion();
  const animatedBalance = useCountUp(balanceMinor);

  function handleFlip() {
    setFlipped((v) => !v);
    onFlip?.();
  }

  return (
    <div className="relative" style={{ perspective: 1200 }}>
      <motion.div
        className="relative h-52 w-full cursor-pointer rounded-2xl"
        style={{ transformStyle: "preserve-3d" }}
        animate={reduceMotion ? {} : { rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        onClick={handleFlip}
        role="button"
        tabIndex={0}
        aria-label="Flip wallet card"
        onKeyDown={(e) => e.key === "Enter" && handleFlip()}
      >
        {/* Front */}
        <div
          className="absolute inset-0 flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-purple-700 via-purple-900 to-slate-950 p-5 text-white shadow-xl ring-1 ring-white/10"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-400/20 blur-2xl" aria-hidden="true" />
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-bold tracking-wide">
              <PayWallet width={18} height={18} aria-hidden="true" /> V.Wallet
            </span>
            <IconRotate size={16} className="text-white/60" />
          </div>

          <div>
            <p className="text-xs font-medium text-white/60">Available balance</p>
            <p className="text-3xl font-extrabold tabular-nums">€{(animatedBalance / 100).toFixed(2)}</p>
            {lowBalance && (
              <motion.p
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                className="mt-1 text-xs font-semibold text-amber-300"
              >
                Low balance — top up to avoid interruptions
              </motion.p>
            )}
          </div>

          <div className="flex items-end justify-between gap-2">
            <p className="shrink-0 font-mono text-sm tracking-widest text-white/80">{maskWalletId(customerId)}</p>
            <p className="min-w-0 flex-1 truncate text-right text-sm font-semibold">{customerName}</p>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-black p-5 text-white shadow-xl ring-1 ring-white/10"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="flex items-center gap-1.5 text-sm font-bold tracking-wide">
            <IconSparkles size={18} className="text-amber-300" /> Reward Points
          </div>
          <div>
            <p className="text-3xl font-extrabold tabular-nums">{rewardPoints}</p>
            <p className="text-xs font-medium text-white/60">points available</p>
          </div>
          <p className="text-xs text-white/50">Tap to flip back</p>
        </div>
      </motion.div>
    </div>
  );
}
