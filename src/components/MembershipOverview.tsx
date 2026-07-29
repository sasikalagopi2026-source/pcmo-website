import { Shield, CalendarDays, CalendarClock, Timer, CreditCard } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import PcmoLogo from "@/components/PcmoLogo";

type MembershipData = {
  plan_name: string;
  status: string;
  starts_at: string;
  ends_at?: string | null;
};

const MembershipOverview = ({ membership, memberName, memberNumber }: { membership: MembershipData | null; memberName: string; memberNumber?: string | null }) => {
  const start = membership?.starts_at ? new Date(membership.starts_at) : null;
  const end = membership?.ends_at ? new Date(membership.ends_at) : null;
  const today = new Date();
  const memberSince = start ? start.toLocaleDateString() : "Not active";
  const expiryDate = end ? end.toLocaleDateString() : "No expiry";
  const daysRemaining = end ? Math.max(0, Math.ceil((end.getTime() - today.getTime()) / 86400000)) : 0;
  const totalDays = start && end ? Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000)) : 1;
  const progressPercent = start ? Math.min(100, Math.max(0, ((totalDays - daysRemaining) / totalDays) * 100)) : 0;

  return (
    <div className="bg-card rounded-xl border border-border animate-fade-in" style={{ animationDelay: "0.1s" }}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading font-bold text-lg text-foreground">Membership Overview</h2>
          <Link to="/membership#membership-plans" className="text-xs text-primary font-medium hover:underline">View Details →</Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col items-center text-center p-4 rounded-xl bg-primary/5 border border-primary/10">
            <Shield className="w-7 h-7 text-primary mb-2" />
            <p className="font-heading font-bold text-foreground text-sm">{membership?.plan_name || "No plan"}</p>
            <p className="text-xs text-muted-foreground">Membership</p>
            <span className="mt-2 text-xs font-semibold bg-success/15 text-success px-3 py-0.5 rounded-full">{membership?.status || "Inactive"}</span>
          </div>
          <div className="flex flex-col items-center text-center p-4 rounded-xl bg-info/5 border border-info/10">
            <CalendarDays className="w-7 h-7 text-info mb-2" />
            <p className="font-heading font-bold text-foreground text-sm">{memberSince}</p>
            <p className="text-xs text-muted-foreground">Member Since</p>
          </div>
          <div className="flex flex-col items-center text-center p-4 rounded-xl bg-warning/5 border border-warning/10">
            <CalendarClock className="w-7 h-7 text-warning mb-2" />
            <p className="font-heading font-bold text-foreground text-sm">{expiryDate}</p>
            <p className="text-xs text-muted-foreground">Expiry Date</p>
          </div>
          <div className="flex flex-col items-center text-center p-4 rounded-xl bg-success/5 border border-success/10">
            <Timer className="w-7 h-7 text-success mb-2" />
            <p className="font-heading font-bold text-foreground text-sm">{daysRemaining}</p>
            <p className="text-xs text-muted-foreground">Days Remaining</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-5">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Membership Progress</span>
            <span>{Math.round(progressPercent)}% used</span>
          </div>
          <Progress value={progressPercent} className="h-2.5" />
        </div>
      </div>

      {/* Membership Card Preview */}
      <div className="border-t border-border p-6">
        <h3 className="font-heading font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-primary" /> Membership Card Preview
        </h3>
        <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/70 rounded-xl p-5 text-primary-foreground max-w-sm shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <PcmoLogo light showTagline={false} className="h-7 w-28" />
            <span className="text-xs bg-primary-foreground/20 px-2 py-0.5 rounded-full">{membership?.plan_name || "Member"}</span>
          </div>
          <p className="font-heading font-bold text-lg">{memberName}</p>
          <p className="text-xs text-primary-foreground/70 mt-1">ID: {memberNumber || "Pending"}</p>
          <div className="flex justify-between items-end mt-4">
            <div>
              <p className="text-[10px] text-primary-foreground/50 uppercase tracking-wider">Valid Until</p>
              <p className="text-xs font-medium">{expiryDate}</p>
            </div>
            <Shield className="w-8 h-8 text-primary-foreground/20" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembershipOverview;
