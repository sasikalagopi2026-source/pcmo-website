import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { resourceApi } from "@/lib/api";

type Invoice = { invoice_number: string; description?: string; amount: number; currency: string; status: string; invoice_date: string; due_date?: string };

const InvoiceDetail = () => {
  const { id = "" } = useParams();
  const invoice = useQuery({ queryKey: ["invoice", id], queryFn: () => resourceApi.get<Invoice>("invoices", id), enabled: Boolean(id) });
  return <DashboardLayout><div className="max-w-2xl rounded-xl border border-border bg-card p-8">{invoice.isLoading ? <p>Loading…</p> : invoice.error ? <p className="text-destructive">{invoice.error.message}</p> : <><h1 className="font-heading text-2xl font-bold">Invoice {invoice.data?.invoice_number}</h1><p className="mt-2 text-muted-foreground">{invoice.data?.description}</p><p className="mt-6 text-3xl font-bold">{invoice.data?.currency} {Number(invoice.data?.amount).toLocaleString()}</p><div className="mt-5 space-y-1 text-sm"><p>Status: {invoice.data?.status}</p><p>Date: {invoice.data?.invoice_date}</p><p>Due: {invoice.data?.due_date || "Not set"}</p></div></>}</div></DashboardLayout>;
};

export default InvoiceDetail;
