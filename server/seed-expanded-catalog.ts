import { createHash } from "node:crypto";
import { db } from "./db.js";

const stableId = (value: string) => {
  const hex = createHash("sha256").update(value).digest("hex").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20)}`;
};

const courses = [
  ["project-management-foundations", "Project Management Foundations", "Project Management", "Beginner", "6 weeks", 12, 0, "Build a practical foundation in project initiation, planning, delivery, monitoring, and closure."],
  ["contract-management-essentials", "Contract Management Essentials", "Contract Management", "Beginner", "5 weeks", 10, 0, "Understand contract lifecycles, obligations, variations, performance controls, and closeout."],
  ["advanced-project-risk-management", "Advanced Project Risk Management", "Risk Management", "Advanced", "8 weeks", 16, 249, "Apply qualitative and quantitative methods to identify, assess, respond to, and monitor project risk."],
  ["project-cost-control-earned-value", "Project Cost Control & Earned Value", "Cost Management", "Intermediate", "7 weeks", 14, 199, "Control budgets and forecasts using earned value, variance analysis, and performance reporting."],
  ["agile-hybrid-delivery", "Agile & Hybrid Project Delivery", "Agile", "Intermediate", "6 weeks", 12, 149, "Blend predictive and adaptive delivery approaches for complex organizational environments."],
  ["stakeholder-engagement-communication", "Stakeholder Engagement & Communication", "Leadership", "Intermediate", "4 weeks", 8, 99, "Map stakeholders, plan engagement, handle resistance, and communicate for decisions and outcomes."],
  ["procurement-tender-management", "Procurement & Tender Management", "Procurement", "Intermediate", "6 weeks", 12, 179, "Plan sourcing, prepare tender documents, evaluate bids, and manage transparent procurement decisions."],
  ["project-leadership-teams", "Project Leadership & High-Performance Teams", "Leadership", "Advanced", "5 weeks", 10, 129, "Lead diverse project teams through conflict, change, accountability, and continuous improvement."],
  ["quality-management-projects", "Quality Management for Projects", "Quality Management", "Intermediate", "5 weeks", 10, 119, "Plan quality, define acceptance criteria, assure processes, and control deliverable performance."],
  ["digital-transformation-program-management", "Digital Transformation Program Management", "Program Management", "Advanced", "9 weeks", 18, 299, "Govern transformation portfolios, manage benefits, coordinate change, and align technology with strategy."],
] as const;

const plans = [
  ["student-membership", "Student Membership", 0, "yearly", "Free access to community resources, selected courses, events, and student career support.", ["Community access", "15 library resources", "2 free foundation courses", "Student events", "Career roadmap"]],
  ["individual-membership", "Individual Professional", 79, "yearly", "Professional learning resources, member pricing, certificates, networking, and career tools.", ["All student benefits", "Member course discounts", "Digital certificates", "Professional networking", "Career tools"]],
  ["premium-membership", "Premium Professional", 149, "yearly", "All individual benefits plus premium courses, advanced reports, and priority event access.", ["All individual benefits", "4 premium courses included", "Advanced learning reports", "Priority events", "Certificate verification"]],
  ["team-membership", "Team Membership", 399, "yearly", "Learning and reporting access for teams of up to ten professionals.", ["Up to 10 members", "Team progress dashboard", "Shared learning paths", "Manager reports", "Premium resources"]],
  ["corporate-membership", "Corporate Membership", 999, "yearly", "Organization-wide development, analytics, branded learning pathways, and administrative controls.", ["Up to 50 members", "Corporate analytics", "Branded learning paths", "Admin controls", "Priority support"]],
  ["lifetime-membership", "Lifetime Membership", 1299, "one-time", "Permanent professional membership with ongoing access to core member benefits.", ["Lifetime individual access", "All core courses", "Permanent resource access", "Digital certificates", "Member pricing for events"]],
] as const;

const resources = [
  ["project-charter-template", "Project Charter Template", "template", "Project Management", "A ready-to-use charter covering objectives, scope, governance, risks, milestones, and approvals."],
  ["risk-register-toolkit", "Risk Register Toolkit", "toolkit", "Risk Management", "A practical risk register with scoring guidance, response planning, ownership, and review prompts."],
  ["contract-closeout-checklist", "Contract Closeout Checklist", "checklist", "Contract Management", "Verify deliverables, claims, records, payments, lessons learned, and formal contract closure."],
  ["earned-value-quick-guide", "Earned Value Management Quick Guide", "guide", "Cost Management", "Understand PV, EV, AC, CPI, SPI, EAC, and practical interpretation of project performance."],
  ["stakeholder-mapping-canvas", "Stakeholder Mapping Canvas", "worksheet", "Leadership", "Map power, interest, influence, expectations, communication needs, and engagement actions."],
  ["procurement-evaluation-matrix", "Procurement Evaluation Matrix", "template", "Procurement", "Structure compliant technical and commercial bid evaluations with transparent scoring."],
  ["agile-retrospective-playbook", "Agile Retrospective Playbook", "ebook", "Agile", "Facilitation formats, questions, anti-patterns, and action tracking for productive retrospectives."],
  ["project-status-report", "Executive Project Status Report", "template", "Reporting", "A concise executive report for health, milestones, budget, risks, decisions, and next steps."],
  ["quality-audit-checklist", "Project Quality Audit Checklist", "checklist", "Quality Management", "Review quality planning, process compliance, deliverable evidence, defects, and corrective actions."],
  ["change-request-form", "Change Request & Impact Assessment", "template", "Change Management", "Capture rationale, impacts, options, approvals, implementation, and benefit implications."],
  ["lessons-learned-workshop", "Lessons Learned Workshop Guide", "guide", "Project Management", "Run a structured review that converts experience into reusable organizational knowledge."],
  ["project-kpi-library", "Project KPI Library", "reference", "Analytics", "A curated set of schedule, cost, quality, risk, stakeholder, and benefits indicators."],
  ["negotiation-preparation-sheet", "Contract Negotiation Preparation Sheet", "worksheet", "Contract Management", "Prepare interests, positions, alternatives, concessions, evidence, authority, and desired outcomes."],
  ["program-benefits-register", "Program Benefits Register", "template", "Program Management", "Define benefit owners, baselines, targets, dependencies, measures, and realization dates."],
  ["career-development-roadmap", "Project Professional Career Roadmap", "guide", "Career Development", "Plan competencies, experience, certifications, leadership growth, and professional evidence."],
] as const;

for (const [slug, title, category, level, duration, credits, price, description] of courses) {
  await db.execute(
    `INSERT INTO courses
      (id,title,slug,description,level,duration,credits,category,instructor,price,capacity,status,preview_content,certificate_template,discount_percent)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,'published',?,?,0)
     ON DUPLICATE KEY UPDATE title=VALUES(title),description=VALUES(description),level=VALUES(level),
       duration=VALUES(duration),credits=VALUES(credits),category=VALUES(category),instructor=VALUES(instructor),
       price=VALUES(price),capacity=VALUES(capacity),status='published',certificate_template=VALUES(certificate_template)`,
    [stableId(`course:${slug}`), title, slug, description, level, duration, credits, category, "PCMO Faculty", price, 500, JSON.stringify({ seededCatalog: true }), "PCMO Professional Certificate"],
  );
}

for (const [slug, name, price, billingPeriod, description, benefits] of plans) {
  await db.execute(
    `INSERT INTO membership_plans
      (id,slug,name,description,price,currency,billing_period,benefits,source_url,status,synced_at)
     VALUES (?,?,?,?,?,'USD',?,?,?,'published',NOW())
     ON DUPLICATE KEY UPDATE name=VALUES(name),description=VALUES(description),price=VALUES(price),
       billing_period=VALUES(billing_period),benefits=VALUES(benefits),source_url=VALUES(source_url),status='published',synced_at=NOW()`,
    [stableId(`plan:${slug}`), slug, name, description, price, billingPeriod, JSON.stringify(benefits), `/membership#${slug}`],
  );
}

for (const [slug, title, type, category, excerpt] of resources) {
  const body = `${excerpt}\n\nHow to use this resource:\n1. Adapt it to the size and complexity of your work.\n2. Assign clear owners and review dates.\n3. Retain evidence of decisions and approvals.\n4. Review and improve the document throughout delivery.`;
  await db.execute(
    `INSERT INTO library_contents
      (id,title,slug,excerpt,body,type,category,subcategory,tags,author,reviewer,status,published_at,attachments,visibility,views,downloads,shares,reposts)
     VALUES (?,?,?,?,?,?,?,?,?,'PCMO Learning Team','PCMO Quality Review','published',NOW(),'[]',?,0,0,0,0)
     ON DUPLICATE KEY UPDATE title=VALUES(title),excerpt=VALUES(excerpt),body=VALUES(body),type=VALUES(type),
       category=VALUES(category),subcategory=VALUES(subcategory),tags=VALUES(tags),author=VALUES(author),
       reviewer=VALUES(reviewer),status='published',published_at=COALESCE(published_at,NOW()),visibility=VALUES(visibility)`,
    [stableId(`resource:${slug}`), title, slug, excerpt, body, type, category, "Professional Resources", JSON.stringify([category, type, "PCMO"]), JSON.stringify({ membership: ["free", "paid"] })],
  );
}

console.log(`Expanded catalog ready: ${courses.length} courses, ${plans.length} membership plans, ${resources.length} library resources.`);
await db.end();
