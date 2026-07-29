import { currencies, type CurrencyCode, useCurrency } from "@/hooks/useCurrency";

const CurrencySelector = () => {
  const { currency, setCurrency } = useCurrency();
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Currency</span>
      <select
        value={currency}
        onChange={(event) => setCurrency(event.target.value as CurrencyCode)}
        className="rounded-md border border-border bg-background px-3 py-2"
      >
        {currencies.map((item) => <option key={item.code} value={item.code}>{item.code} — {item.label}</option>)}
      </select>
    </label>
  );
};

export default CurrencySelector;
