"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import UserHeader from "@/components/UserHeader";
import UserFooter from "@/components/UserFooter";
import MobileBottomNav from "@/components/MobileBottomNav";
import VedicLoader from "@/components/VedicLoader";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const packs = [
  { amount: 100, label: "₹100", tag: null },
  { amount: 200, label: "₹200", tag: "🔥 Most Popular" },
  { amount: 500, label: "₹500", tag: null },
];

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function WalletPage() {
  const router = useRouter();
  const { status, data: session } = useSession();
  const { data: profile, isLoading, mutate } = useSWR("/api/user/profile", fetcher);
  const balance = profile?.walletBalance !== undefined ? Number(profile.walletBalance) : null;

  const [paying, setPaying] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedPack, setSelectedPack] = useState<number | null>(200);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadRazorpayScript = () =>
    new Promise<boolean>((resolve) => {
      if (document.getElementById("razorpay-script")) return resolve(true);
      const script = document.createElement("script");
      script.id = "razorpay-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handleRecharge = async (amount: number) => {
    if (!amount || amount < 10) {
      alert("Minimum recharge amount is ₹10.");
      return;
    }

    setPaying(true);
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      alert("Failed to load payment gateway. Please check your connection.");
      setPaying(false);
      return;
    }

    try {
      const res = await fetch("/api/user/wallet/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const order = await res.json();
      if (!res.ok) {
        alert(order.error || "Failed to create order.");
        setPaying(false);
        return;
      }

      const options = {
        key: order.keyId,
        amount: order.amount * 100,
        currency: order.currency,
        name: "AstroWalla",
        description: "Wallet Top-up",
        order_id: order.orderId,
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/user/wallet/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount,
            }),
          });
          const vData = await verifyRes.json();
          if (verifyRes.ok) {
            setSuccessMsg(`₹${amount} added to your wallet!`);
            mutate(); // refresh balance immediately
          } else {
            alert(vData.error || "Payment verification failed.");
          }
          setPaying(false);
        },
        prefill: {
          name: session?.user?.name || "",
          email: session?.user?.email || "",
        },
        theme: { color: "#f5c842" },
        modal: {
          ondismiss: () => setPaying(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
      setPaying(false);
    }
  };

  if (status === "loading" || balance === null) {
    return (
      <div className="min-h-screen flex flex-col bg-[#faf8f5]">
        <UserHeader />
        <div className="flex-1 flex items-center justify-center">
          <VedicLoader size="lg" text="Loading wallet..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-800 bg-[#faf8f5]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <UserHeader />

      {/* SUCCESS TOAST */}
      {successMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white font-bold px-6 py-3 rounded-2xl shadow-lg animate-in fade-in slide-in-from-top-4 duration-300 flex items-center gap-2">
          <span>✓</span> {successMsg}
          <button onClick={() => setSuccessMsg(null)} className="ml-2 opacity-70 hover:opacity-100">×</button>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 sm:px-6 mt-8 mb-24">
        {/* Banner */}
        <div className="bg-white border border-[#f5c842]/30 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden shadow-[0_10px_40px_rgba(245,200,66,0.1)]">
          <div className="absolute top-[-50%] right-[-10%] w-96 h-96 bg-gradient-to-bl from-[#FF9933]/10 to-transparent rounded-full pointer-events-none" />
          <div className="relative z-10">
            <h1 className="text-3xl sm:text-4xl font-cinzel font-bold text-slate-800 mb-2 tracking-tight">Wallet</h1>
            <p className="text-slate-500 font-medium text-sm">Add money to chat with astrologers instantly.</p>
            <div className="flex flex-wrap gap-2 mt-4 text-[10px] font-extrabold tracking-widest uppercase">
              <span className="bg-orange-50 border border-orange-100 text-orange-600 px-3 py-1.5 rounded-full">Secure payments</span>
              <span className="bg-orange-50 border border-orange-100 text-orange-600 px-3 py-1.5 rounded-full">Instant credit</span>
              <span className="bg-orange-50 border border-orange-100 text-orange-600 px-3 py-1.5 rounded-full">UPI · Cards · Netbanking</span>
            </div>
          </div>
          <div className="bg-[#faf8f5] border border-[#f5c842]/40 rounded-2xl p-5 min-w-[200px] relative z-10 flex flex-col justify-center shadow-inner">
            <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Available Balance</div>
            <div className="text-4xl font-cinzel font-bold text-[#10b981] drop-shadow-sm">₹ {balance.toFixed(0)}</div>
          </div>
        </div>

        {/* Recharge Packs */}
        <div className="mt-10 mb-5 border-b border-slate-200 pb-4">
          <h2 className="text-xl font-cinzel font-bold text-slate-800">Select Amount</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">You pay exactly what you see — no bonuses, no deductions</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {packs.map((pack) => (
            <button
              key={pack.amount}
              onClick={() => { setSelectedPack(pack.amount); setCustomAmount(""); }}
              disabled={paying}
              className={`relative bg-white border transition-all p-4 rounded-2xl flex flex-col items-center gap-1 shadow-sm disabled:opacity-50 ${
                selectedPack === pack.amount
                  ? "border-[#f5c842] shadow-[0_4px_20px_rgba(245,200,66,0.3)] scale-105 bg-[#fffbee]"
                  : "border-slate-200 hover:border-[#f5c842]/60 hover:shadow-md hover:bg-[#fdfaf5]"
              }`}
            >
              {pack.tag && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#FF9933] to-[#f5c842] text-stone-900 shadow-sm">
                  {pack.tag}
                </span>
              )}
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">Add</div>
              <div className="text-xl sm:text-2xl font-extrabold text-slate-800">{pack.label}</div>
            </button>
          ))}
        </div>

        {/* Custom Amount */}
        <div className="mt-6 flex gap-3 items-center">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-lg">₹</span>
            <input
              type="number"
              min={10}
              placeholder="Enter custom amount"
              value={customAmount}
              onChange={(e) => { setCustomAmount(e.target.value); setSelectedPack(null); }}
              className="w-full pl-8 pr-4 py-3.5 border border-slate-200 bg-white rounded-2xl font-bold text-slate-800 focus:outline-none focus:border-[#f5c842] focus:ring-2 focus:ring-[#f5c842]/20 transition-all text-sm"
            />
          </div>
        </div>

        {/* Pay Button */}
        <button
          onClick={() => {
            const amount = selectedPack ?? Number(customAmount);
            handleRecharge(amount);
          }}
          disabled={paying || (!selectedPack && !customAmount)}
          className="mt-5 w-full bg-gradient-to-r from-[#f5c842] to-[#ffb347] text-stone-900 font-extrabold py-4 rounded-2xl text-base shadow-md shadow-amber-200/50 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {paying ? (
            <>
              <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Opening Payment...
            </>
          ) : (
            `Pay ₹${(selectedPack ?? customAmount) || "—"}`
          )}
        </button>

        {/* Transaction Log Link */}
        <div className="mt-6 text-center">
          <a href="/transactions" className="text-sm text-slate-400 hover:text-slate-600 font-bold transition-colors underline underline-offset-4">View Transaction History →</a>
        </div>
      </main>

      <MobileBottomNav />
      <UserFooter />
    </div>
  );
}
