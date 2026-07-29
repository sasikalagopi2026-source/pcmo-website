import { useNavigate } from "react-router-dom";
import { BookOpen, Award, Bell, FileCheck } from "lucide-react";

const StatsCards = ({ values }: { values: Record<string, number> }) => {
  const stats = [
    { icon: BookOpen, label: "Courses", value: values.courses ?? 0, color: "text-info", bg: "bg-info/10", border: "border-info/20" },
    { icon: Award, label: "Certificates", value: values.certificates ?? 0, color: "text-warning", bg: "bg-warning/10", border: "border-warning/20" },
    { icon: FileCheck, label: "Assignments", value: values.assignments ?? 0, color: "text-success", bg: "bg-success/10", border: "border-success/20" },
    { icon: Bell, label: "Notifications", value: values.notifications ?? 0, color: "text-accent", bg: "bg-accent/10", border: "border-accent/20" },
  ];
  const navigate = useNavigate();
  const handleClick = (label: string) => {
    switch (label) {
      case "Courses":
        navigate("/courses");
        break;
      case "Certificates":
        navigate("/certifications");
        break;
      case "Assignments":
        navigate("/certification-quiz");
        break;
      case "Notifications":
        navigate("/notifications");
        break;
      default:
        navigate("/");
    }
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in" style={{ animationDelay: "0.05s" }}>
      {stats.map((s) => (
        <button
          key={s.label}
          type="button"
          onClick={() => handleClick(s.label)}
          className={`w-full text-left bg-card rounded-xl border ${s.border} p-5 flex items-center gap-4 hover:shadow-md transition-all group`}
        >
          <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center group-hover:scale-105 transition-transform`}>
            <s.icon className={`w-5 h-5 ${s.color}`} />
          </div>
          <div>
            <p className="text-2xl font-heading font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        </button>
      ))}
    </div>
  );
};

export default StatsCards;
