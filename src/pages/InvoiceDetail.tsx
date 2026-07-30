import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { resourceApi, api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

type Invoice = { id: string; invoice_number: string; description?: string; amount: number; currency: string; status: string; invoice_date: string; due_date?: string };

const InvoiceDetail = () => {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const invoice = useQuery({ queryKey: ["invoice", id], queryFn: () => resourceApi.get<Invoice>("invoices", id), enabled: Boolean(id) });

  const handleRefund = async () => {
    if (!id) return;
    if (!confirm("Are you sure you want to issue a refund for this invoice?")) return;
    try {
      setLoading(true);
      await api("/api/admin/refunds", { method: "POST", body: JSON.stringify({ invoiceId: id }) });
      await queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      await queryClient.invalidateQueries({ queryKey: ["invoices"] });
      alert("Refund issued successfully.");
    } catch (err: any) {
      alert(err?.message || "Refund failed");
    } finally {
      setLoading(false);
    }
  };

  return <DashboardLayout><div className="max-w-2xl rounded-xl border border-border bg-card p-8">{invoice.isLoading ? <p>Loading…</p> : invoice.error ? <p className="text-destructive">{invoice.error.message}</p> : <><h1 className="font-heading text-2xl font-bold">Invoice {invoice.data?.invoice_number}</h1><p className="mt-2 text-muted-foreground">{invoice.data?.description}</p><p className="mt-6 text-3xl font-bold">{invoice.data?.currency} {Number(invoice.data?.amount).toLocaleString()}</p><div className="mt-5 space-y-1 text-sm"><p>Status: {invoice.data?.status}</p><p>Date: {invoice.data?.invoice_date}</p><p>Due: {invoice.data?.due_date || "Not set"}</p></div>{(user?.role === "admin" || user?.role === "super_admin") && invoice.data?.status === "paid" ? <div className="mt-6"><button disabled={loading} onClick={handleRefund} className="rounded bg-red-600 px-4 py-2 text-white">{loading ? "Processing…" : "Refund"}</button></div> : null}</>}</div></DashboardLayout>;
};

export default InvoiceDetail;
