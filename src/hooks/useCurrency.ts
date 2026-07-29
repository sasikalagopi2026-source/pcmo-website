import { useEffect, useState } from "react";

export type CurrencyCode = "USD" | "AED" | "EUR" | "GBP" | "INR" | "SAR";

export const currencies: Array<{ code: CurrencyCode; label: string; rate: number }> = [
  { code: "USD", label: "US Dollar", rate: 1 },
  { code: "AED", label: "UAE Dirham", rate: 3.6725 },
  { code: "EUR", label: "Euro", rate: 0.92 },
  { code: "GBP", label: "British Pound", rate: 0.79 },
  { code: "INR", label: "Indian Rupee", rate: 83.5 },
  { code: "SAR", label: "Saudi Riyal", rate: 3.75 },
];

const key = "pcmo_currency";

export const formatCurrency = (usdAmount: number, currency: CurrencyCode) => {
  const rate = currencies.find((item) => item.code === currency)?.rate ?? 1;
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "INR" ? 0 : 2,
  }).format(usdAmount * rate);
};

export const useCurrency = () => {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    const stored = localStorage.getItem(key) as CurrencyCode | null;
    return currencies.some((item) => item.code === stored) ? stored! : "USD";
  });

  useEffect(() => {
    const sync = () => setCurrencyState((localStorage.getItem(key) as CurrencyCode | null) ?? "USD");
    window.addEventListener("pcmo-currency-change", sync);
    return () => window.removeEventListener("pcmo-currency-change", sync);
  }, []);

  const setCurrency = (next: CurrencyCode) => {
    localStorage.setItem(key, next);
    setCurrencyState(next);
    window.dispatchEvent(new Event("pcmo-currency-change"));
  };

  return { currency, setCurrency, format: (amount: number) => formatCurrency(amount, currency) };
};
