"use client";

import { useState } from "react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface IntroChatPaywallProps {
  onActivated: () => void;
  onClose: () => void;
}

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

export default function IntroChatPaywall({ onActivated, onClose }: IntroChatPaywallProps) {
  const [paying, setPaying] = useState(false);

  const unlockIntroPass = async () => {
    setPaying(true);
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      alert("Unable to load the payment gateway. Please check your connection.");
      setPaying(false);
      return;
    }

    try {
      const orderRes = await fetch("/api/user/wallet/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 1, purpose: "INTRO_CHAT_PASS" }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) {
        alert(order.error || "Unable to create your payment.");
        setPaying(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount * 100,
        currency: order.currency,
        name: "AstroWalla",
        description: "3-minute Intro Chat Pass",
        order_id: order.orderId,
        theme: { color: "#f5c842" },
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/user/wallet/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: 1,
              purpose: "INTRO_CHAT_PASS",
            }),
          });
          const verified = await verifyRes.json();
          if (verifyRes.ok) onActivated();
          else alert(verified.error || "Payment verification failed.");
          setPaying(false);
        },
        modal: { ondismiss: () => setPaying(false) },
      });
      rzp.open();
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
      setPaying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="bg-[#fff7df] px-6 pb-5 pt-7 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5c842] text-2xl font-black text-amber-900">1</div>
          <h2 className="font-cinzel text-2xl font-extrabold text-slate-900">Start with 3 minutes</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">Unlock your first three minutes of chat for just Rs 1.</p>
        </div>

        <div className="p-6">
          <div className="mb-5 grid grid-cols-3 gap-2 text-center text-xs font-bold text-slate-600">
            <div className="rounded-xl bg-slate-50 px-2 py-3">Pay once</div>
            <div className="rounded-xl bg-slate-50 px-2 py-3">Chat 3 min</div>
            <div className="rounded-xl bg-slate-50 px-2 py-3">Secure Razorpay</div>
          </div>
          <button
            onClick={unlockIntroPass}
            disabled={paying}
            className="w-full rounded-xl bg-[#FF9933] px-4 py-3.5 text-sm font-extrabold text-white shadow-md transition hover:bg-[#e88627] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {paying ? "Opening payment..." : "Pay Rs 1 and unlock 3 minutes"}
          </button>
          <button onClick={onClose} disabled={paying} className="mt-3 w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-700 disabled:opacity-50">
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
