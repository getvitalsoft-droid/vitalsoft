"use client";
// components/StripeCheckout.tsx
// Formulario de pago embebido con Stripe Elements.
// El cliente no sale de vitalsoft.pro en ningún momento.

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Lock, ArrowRight, ChevronLeft } from "lucide-react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CheckoutData {
  name: string;
  email: string;
  social: string;
  notes: string;
  videos: number;
  price: number;
  ref?: string;
  client_ref?: string;
}

interface Props {
  data: CheckoutData;
  onBack: () => void;
  onSuccess: () => void;
}

// Formulario interno (necesita estar dentro de <Elements>)
function CheckoutForm({ price, onSuccess }: { price: number; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError("");

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/?pago=ok`,
      },
      redirect: "if_required",
    });

    if (stripeError) {
      setError(stripeError.message || "Error al procesar el pago");
      setLoading(false);
      return;
    }

    // Pago confirmado sin redirección
    onSuccess();
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <PaymentElement
          options={{
            layout: "tabs",
            fields: { billingDetails: { address: { country: "never" } } },
          }}
        />
      </div>

      {error && (
        <div className="mb-4 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-2 text-[#080808] font-display font-black text-base py-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_40px_rgba(232,255,71,0.35)] disabled:opacity-60"
      >
        {loading ? (
          "Procesando..."
        ) : (
          <>
            <span>Pagar €{price.toLocaleString("es-ES")}/mes</span>
            <ArrowRight size={18} />
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-2 mt-4 text-white/25 text-xs">
        <Lock size={11} />
        Pago cifrado con Stripe · Sin permanencia · Cancela cuando quieras
      </div>
    </form>
  );
}

// Wrapper principal que inicializa Elements
export default function StripeCheckout({ data, onBack, onSuccess }: Props) {
  const [clientSecret, setClientSecret] = useState("");
  const [loadingIntent, setLoadingIntent] = useState(true);
  const [intentError, setIntentError] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch("/api/checkout-elements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (json.clientSecret) {
          setClientSecret(json.clientSecret);
        } else {
          setIntentError(json.error || "Error al preparar el pago");
        }
      } catch {
        setIntentError("Error de conexión");
      }
      setLoadingIntent(false);
    };
    init();
  }, []);

  const appearance = {
    theme: "night" as const,
    variables: {
      colorPrimary: "#e8ff47",
      colorBackground: "#111111",
      colorText: "#f0f0f0",
      colorDanger: "#ff4444",
      fontFamily: "system-ui, sans-serif",
      spacingUnit: "4px",
      borderRadius: "8px",
    },
    rules: {
      ".Input": {
        backgroundColor: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "#f0f0f0",
      },
      ".Input:focus": {
        border: "1px solid rgba(232,255,71,0.4)",
        boxShadow: "none",
      },
      ".Label": { color: "rgba(255,255,255,0.35)", fontSize: "12px" },
      ".Tab": {
        backgroundColor: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "rgba(255,255,255,0.6)",
      },
      ".Tab--selected": {
        backgroundColor: "rgba(232,255,71,0.08)",
        border: "1px solid rgba(232,255,71,0.3)",
        color: "#e8ff47",
      },
    },
  };

  return (
    <div>
      {/* Resumen del pedido */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/50 text-sm">Plan seleccionado</span>
          <span className="font-display font-bold text-accent text-lg">
            €{data.price.toLocaleString("es-ES")}/mes
          </span>
        </div>
        <div className="text-white/30 text-xs">
          {data.videos} clips mensuales · Renovación automática · Cancela cuando quieras
        </div>
      </div>

      {loadingIntent && (
        <div className="text-center text-white/30 text-sm py-8">
          Preparando pago seguro...
        </div>
      )}

      {intentError && (
        <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3 mb-4">
          {intentError}
        </div>
      )}

      {clientSecret && (
        <Elements
          stripe={stripePromise}
          options={{ clientSecret, appearance, locale: "es" }}
        >
          <CheckoutForm price={data.price} onSuccess={onSuccess} />
        </Elements>
      )}

      <button
        onClick={onBack}
        className="flex items-center gap-1 text-white/25 text-xs mt-4 hover:text-white/50 transition-colors"
      >
        <ChevronLeft size={12} /> Volver al formulario
      </button>
    </div>
  );
}
