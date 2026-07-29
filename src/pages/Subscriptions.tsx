import { useQuery } from "@tanstack/react-query";
import { CreditCard, FileText } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { resourceApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

type Subscription = {
  id: string; plan_name: string; price: number; currency: string; status: string;
  starts_at?: string; ends_at?: string; next_billing?: string; auto_renew: number; payment_method?: string;
};
type Invoice = {
  id: string; invoice_number: string; description?: string; amount: number; currency: string;
  status: string; invoice_date: string; due_date?: string;
};

const Subscriptions = () => {
  const subscriptions = useQuery({ queryKey: ["subscriptions"], queryFn: () => resourceApi.list<Subscription>("subscriptions", { limit: 100 }) });
  const invoices = useQuery({ queryKey: ["invoices"], queryFn: () => resourceApi.list<Invoice>("invoices", { limit: 100 }) });
  return (
    <DashboardLayout>
      <div className="max-w-5xl space-y-8">
        <h1 className="font-heading text-2xl font-bold">Subscriptions & Invoices</h1>
        <section>
          <h2 className="mb-4 font-heading text-lg font-bold">Subscriptions</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {subscriptions.data?.rows.map((item) => (
              <article key={item.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between"><CreditCard className="h-5 w-5 text-primary" /><Badge>{item.status}</Badge></div>
                <h3 className="mt-3 font-semibold">{item.plan_name}</h3>
                <p className="mt-1 text-2xl font-bold">{item.currency} {Number(item.price).toLocaleString()}</p>
                <p className="mt-3 text-xs text-muted-foreground">Next billing: {item.next_billing || "Not scheduled"} · Auto renew: {item.auto_renew ? "Yes" : "No"}</p>
              </article>
            ))}
            {!subscriptions.isLoading && !subscriptions.data?.rows.length && <p className="text-sm text-muted-foreground">No subscriptions found.</p>}
          </div>
        </section>
        <section>
          <h2 className="mb-4 font-heading text-lg font-bold">Invoices</h2>
          <div className="space-y-3">
            {invoices.data?.rows.map((invoice) => (
              <article key={invoice.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-5">
                <FileText className="h-5 w-5 text-primary" />
                <div className="flex-1"><h3 className="font-semibold">{invoice.invoice_number}</h3><p className="text-xs text-muted-foreground">{invoice.description} · {invoice.invoice_date}</p></div>
                <p className="font-semibold">{invoice.currency} {Number(invoice.amount).toLocaleString()}</p>
                <Badge variant="outline">{invoice.status}</Badge>
              </article>
            ))}
            {!invoices.isLoading && !invoices.data?.rows.length && <p className="text-sm text-muted-foreground">No invoices found.</p>}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default Subscriptions;
