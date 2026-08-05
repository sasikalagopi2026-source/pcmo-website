import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Check, ChevronDown, Crown, GraduationCap, Sparkles, UserRound, Users } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import MembershipOverview from "@/components/MembershipOverview";
import CurrencySelector from "@/components/CurrencySelector";
import { api, resourceApi } from "@/lib/api";
import type { ProfileData } from "@/components/ProfileCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/hooks/useCurrency";
import { useSearchParams } from "react-router-dom";

type DashboardData = {
  profile: ProfileData;
  membership: { plan_name: string; status: string; starts_at: string; ends_at?: string | null } | null;
};

type MembershipPlan = {
  id: string; slug: string; name: string; description?: string | null; price?: number | null;
  billing_period?: string | null; benefits?: string[];
};

const goals = [
  { id: "student", label: "I am a student", icon: GraduationCap, plan: "student-membership" },
  { id: "career", label: "Grow my career", icon: UserRound, plan: "premium-membership" },
  { id: "team", label: "Develop my team", icon: Users, plan: "team-membership" },
  { id: "company", label: "Support my organization", icon: Building2, plan: "corporate-membership" },
] as const;

const planMeta: Record<string, { bestFor: string; accent: string }> = {
  "student-membership": { bestFor: "Starting your professional journey", accent: "border-sky-200" },
  "individual-membership": { bestFor: "Independent working professionals", accent: "border-emerald-200" },
  "premium-membership": { bestFor: "Learning, certificates, and career growth", accent: "border-primary" },
  "team-membership": { bestFor: "Small teams with shared learning goals", accent: "border-violet-200" },
  "corporate-membership": { bestFor: "Organization-wide development", accent: "border-amber-200" },
  "lifetime-membership": { bestFor: "Long-term access without renewals", accent: "border-rose-200" },
};

const Membership = () => {
  const [searchParams] = useSearchParams();
  const [goal, setGoal] = useState<(typeof goals)[number]["id"]>("career");
  const [message, setMessage] = useState("");
  const { format, currency } = useCurrency();
  const queryClient = useQueryClient();
  const dashboard = useQuery({ queryKey: ["student-dashboard"], queryFn: () => api<DashboardData>("/api/student/dashboard") });
  const plans = useQuery({ queryKey: ["membership-plans"], queryFn: () => resourceApi.list<MembershipPlan>("membership-plans", { status: "published", limit: 100 }) });
  const recommendedSlug = goals.find((item) => item.id === goal)?.plan ?? "premium-membership";
  const orderedPlans = useMemo(() => [...(plans.data?.rows ?? [])].sort((a, b) => {
    if (a.slug === recommendedSlug) return -1;
    if (b.slug === recommendedSlug) return 1;
    return Number(a.price ?? 0) - Number(b.price ?? 0);
  }), [plans.data, recommendedSlug]);

  const selectPlan = useMutation({
    mutationFn: (plan: MembershipPlan) => {
      const paid = Number(plan.price ?? 0) > 0;
      return api<{ status: string; existing?: boolean; checkoutUrl?: string }>(paid ? "/api/membership/checkout" : "/api/membership/select", {
        method: "POST",
        body: JSON.stringify({ planId: plan.id }),
      });
    },
    onSuccess: (result) => {
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      setMessage(result.status === "active"
        ? "Your membership is active. Welcome to PCMO."
        : "Plan selected. Your paid membership is pending payment confirmation.");
      void queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });

  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      const sessionId = searchParams.get("session_id") || searchParams.get("sessionId");
      if (!sessionId) { setMessage("Payment confirmation is missing. Please refresh or contact support."); return; }
      setMessage("Confirming your membership payment...");
      void api<{ success: boolean }>("/api/stripe/confirm-session", { method: "POST", body: JSON.stringify({ sessionId }) })
        .then(() => {
          setMessage("Your membership is active. Your current plan has been updated.");
          void queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
          void queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
          void queryClient.invalidateQueries({ queryKey: ["membership-plans"] });
        })
        .catch((error: Error) => setMessage(error.message || "We could not confirm your membership payment yet."));
    }
    if (searchParams.get("payment") === "cancelled") {
      setMessage("Payment was cancelled. Your paid membership was not activated.");
    }
    if (window.location.hash === "#membership-plans") {
      requestAnimationFrame(() => document.getElementById("membership-plans")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }, [plans.data, queryClient, searchParams]);

  return (
    <DashboardLayout>
      <div className="max-w-7xl space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge variant="secondary"><Sparkles className="mr-1 h-3.5 w-3.5" />Plan finder</Badge>
            <h1 className="mt-3 font-heading text-3xl font-bold">Choose the membership that fits you</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Tell us what you want to achieve. We will highlight the plan with the strongest benefits for your needs.</p>
          </div>
          <CurrencySelector />
        </div>

        {dashboard.data && <MembershipOverview membership={dashboard.data.membership} memberName={dashboard.data.profile.display_name || dashboard.data.profile.email} memberNumber={dashboard.data.profile.member_number} />}

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-heading text-lg font-semibold">What are you looking for?</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {goals.map((item) => <button key={item.id} onClick={() => setGoal(item.id)} className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${goal === item.id ? "border-primary bg-primary/5 text-primary ring-1 ring-primary" : "border-border hover:bg-secondary/50"}`}><span className="grid h-10 w-10 place-items-center rounded-lg bg-secondary"><item.icon className="h-5 w-5" /></span><span className="font-medium">{item.label}</span></button>)}
          </div>
        </section>

        {message && <p className="rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-success">{message}</p>}
        {selectPlan.error && <p className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{selectPlan.error.message}</p>}

        <section id="membership-plans" className="scroll-mt-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div><h2 className="font-heading text-xl font-bold">Recommended plans</h2><p className="text-sm text-muted-foreground">USD is the base currency. {currency !== "USD" && `${currency} prices are converted estimates.`}</p></div>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {orderedPlans.map((plan) => {
              const recommended = plan.slug === recommendedSlug;
              const active = dashboard.data?.membership?.plan_name === plan.name;
              const price = Number(plan.price ?? 0);
              const monthly = plan.billing_period === "yearly" && price > 0 ? price / 12 : null;
              const benefits = plan.benefits ?? [];
              return <article key={plan.id} className={`relative flex flex-col rounded-2xl border-2 bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${recommended ? "border-primary shadow-primary/10" : planMeta[plan.slug]?.accent ?? "border-border"}`}>
                {recommended && <Badge className="absolute -top-3 left-5"><Crown className="mr-1 h-3.5 w-3.5" />Best match</Badge>}
                <div className="flex items-start justify-between gap-3"><div><h3 className="font-heading text-xl font-bold">{plan.name}</h3><p className="mt-1 text-xs font-medium text-primary">{planMeta[plan.slug]?.bestFor}</p></div>{active && <Badge variant="secondary">Current plan</Badge>}</div>
                <div className="mt-5"><p className="text-3xl font-bold">{price === 0 ? "Free" : format(price)}</p><p className="mt-1 text-xs text-muted-foreground">{plan.billing_period === "one-time" ? "Pay once, no renewal" : monthly ? `${format(monthly)} per month, billed yearly` : `per ${plan.billing_period}`}</p></div>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">{plan.description}</p>
                <div className="my-5 h-px bg-border" />
                <p className="mb-3 text-sm font-semibold">What you get</p>
                <ul className="flex-1 space-y-3">{benefits.map((benefit) => <li key={benefit} className="flex gap-2 text-sm"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success/10"><Check className="h-3.5 w-3.5 text-success" /></span>{benefit}</li>)}</ul>
                <Button className="mt-6 w-full" size="lg" variant={recommended ? "default" : "outline"} disabled={active || selectPlan.isPending} onClick={() => selectPlan.mutate(plan)}>{active ? "Your current plan" : price === 0 ? "Start free" : "Pay with Stripe"}</Button>
              </article>;
            })}
          </div>
        </section>

        <details className="group rounded-2xl border border-border bg-card">
          <summary className="flex cursor-pointer list-none items-center justify-between p-5 font-heading font-semibold">View all benefits side by side<ChevronDown className="h-5 w-5 transition group-open:rotate-180" /></summary>
          <div className="overflow-x-auto border-t border-border p-5">
            <div className="grid min-w-[900px] gap-4" style={{ gridTemplateColumns: `180px repeat(${orderedPlans.length}, minmax(150px, 1fr))` }}>
              <strong>Plan</strong>{orderedPlans.map((plan) => <strong key={plan.id}>{plan.name}</strong>)}
              <span className="text-sm text-muted-foreground">Price</span>{orderedPlans.map((plan) => <span key={plan.id} className="text-sm font-semibold">{Number(plan.price ?? 0) === 0 ? "Free" : format(Number(plan.price))}</span>)}
              <span className="text-sm text-muted-foreground">Top benefits</span>{orderedPlans.map((plan) => <ul key={plan.id} className="space-y-1 text-sm">{(plan.benefits ?? []).map((benefit) => <li key={benefit}>âœ“ {benefit}</li>)}</ul>)}
            </div>
          </div>
        </details>
      </div>
    </DashboardLayout>
  );
};

export default Membership;

