import { createHash } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import { db } from "./db.js";

type CourseRow = RowDataPacket & {
  id: string;
  title: string;
  category: string | null;
  preview_content: string | Record<string, unknown> | null;
};

const stableId = (value: string) => {
  const hex = createHash("sha256").update(value).digest("hex").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20)}`;
};

const parsePreview = (value: CourseRow["preview_content"]) => {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
};

const conceptsFor = (course: CourseRow) => {
  const contract = /contract/i.test(`${course.title} ${course.category ?? ""}`);
  return contract
    ? ["contract lifecycle", "scope and deliverables", "roles and responsibilities", "risk allocation", "change control", "performance monitoring", "stakeholder communication", "negotiation", "compliance and ethics", "closeout and lessons learned"]
    : ["project lifecycle", "scope management", "schedule planning", "cost management", "risk management", "quality management", "stakeholder engagement", "team leadership", "change control", "closure and lessons learned"];
};

const materialsFor = (course: CourseRow, sourceUrl: string | null) => {
  const concepts = conceptsFor(course);
  return [
    { type: "video", title: `Welcome to ${course.title}`, description: "Instructor-led orientation and learning objectives.", body: `This video lesson introduces ${course.title}, its practical value, expected outcomes, and assessment structure.`, duration: "8 min", url: sourceUrl },
    { type: "video", title: `${course.title}: Core Concepts`, description: "Guided explanation of the course framework.", body: `This lesson explains ${concepts.slice(0, 5).join(", ")} using practical workplace examples.`, duration: "18 min", url: sourceUrl },
    { type: "video", title: `${course.title}: Applied Practice`, description: "Scenario-based walkthrough and review.", body: `This lesson applies ${concepts.slice(5).join(", ")} to a realistic professional scenario.`, duration: "22 min", url: sourceUrl },
    { type: "study_guide", title: "Complete Study Guide", description: "A structured guide covering all course concepts.", body: concepts.map((concept, index) => `${index + 1}. ${concept}: define the concept, identify its purpose, apply it to a scenario, and document the result.`).join("\n\n") },
    { type: "reading", title: "Key Terms and Definitions", description: "Essential terminology for revision.", body: concepts.map((concept) => `${concept}: a core discipline in ${course.title} supporting planning, decisions, control, and improvement.`).join("\n\n") },
    { type: "worksheet", title: "Planning Worksheet", description: "A reusable planning and analysis template.", body: "Objective:\nStakeholders:\nScope or deliverables:\nAssumptions:\nConstraints:\nRisks:\nActions:\nOwner:\nDue date:\nSuccess measure:" },
    { type: "case_study", title: "Applied Case Study", description: "Analyse a realistic course-related situation.", body: `A team applying ${course.title} has unclear ownership, changing requirements, and limited performance information. Identify five problems, recommend corrective actions, assign owners, and define measurable success criteria.` },
    { type: "study_guide", title: "Exam Revision Notes", description: "Concise revision prompts for the final quiz.", body: concepts.map((concept) => `For ${concept}, remember: purpose, inputs, technique, output, owner, risk, and evidence.`).join("\n") },
    { type: "worksheet", title: "Risk and Action Register", description: "Template for documenting risks and responses.", body: "ID | Risk or issue | Cause | Impact | Probability | Priority | Response | Owner | Due date | Status" },
    { type: "reading", title: "Further Learning on PCMO", description: "Review current public information on PCMO.", body: `Continue your learning and review current public information for ${course.title}.`, url: sourceUrl },
  ];
};

const assessmentsFor = (course: CourseRow) => [
  { type: "knowledge_check", title: "Module Knowledge Checks", instructions: `Complete the knowledge checks throughout ${course.title}. Review explanations before progressing.`, passingScore: 70, maxAttempts: 5 },
  { type: "case_study", title: "Applied Case Study Assessment", instructions: "Analyse the supplied case, identify the main issues, recommend actions, and justify each recommendation with course concepts.", passingScore: 70, maxAttempts: 3 },
  { type: "assignment", title: "Practical Planning Assignment", instructions: "Produce a concise professional plan containing objectives, scope, stakeholders, risks, controls, owners, dates, and success measures.", passingScore: 70, maxAttempts: 3 },
  { type: "final_exam", title: "Final 50-Question Quiz", instructions: `Answer all 50 questions. A score of 70% or higher is required to pass ${course.title}.`, passingScore: 70, maxAttempts: 3 },
];

const questionTemplates = [
  (concept: string, title: string) => ({ question: `What is the primary purpose of ${concept} in ${title}?`, correct: "To support controlled decisions and measurable outcomes", distractors: ["To remove the need for documentation", "To transfer every decision to one person", "To guarantee that no change will occur"] }),
  (concept: string) => ({ question: `Which action best demonstrates effective ${concept}?`, correct: "Define the approach, assign ownership, record evidence, and review results", distractors: ["Rely only on informal verbal updates", "Wait until closeout before reviewing performance", "Avoid involving affected stakeholders"] }),
  (concept: string) => ({ question: `Which evidence most strongly shows that ${concept} is being managed?`, correct: "An approved record with owners, dates, decisions, and current status", distractors: ["An undocumented conversation", "A personal assumption", "An unsigned draft with no owner"] }),
  (concept: string) => ({ question: `What should happen first when a problem related to ${concept} is identified?`, correct: "Assess the facts, impact, ownership, and required decision", distractors: ["Hide the problem until the next phase", "Implement a major change without approval", "Close the issue without evidence"] }),
  (concept: string) => ({ question: `How should lessons about ${concept} be used?`, correct: "Capture them, validate them, and apply them to future decisions", distractors: ["Keep them only in personal notes", "Delete them after completion", "Use them without checking relevance"] }),
];

const [courses] = await db.execute<CourseRow[]>("SELECT id, title, category, preview_content FROM courses WHERE status = 'published' ORDER BY title");

for (const course of courses) {
  const preview = parsePreview(course.preview_content);
  const sourceUrl = typeof preview.sourceUrl === "string" ? preview.sourceUrl : null;

  for (const [index, material] of materialsFor(course, sourceUrl).entries()) {
    await db.execute(
      `INSERT INTO course_materials
       (id, course_id, material_type, title, description, content_url, body, duration, sort_order, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')
       ON DUPLICATE KEY UPDATE material_type=VALUES(material_type), title=VALUES(title),
       description=VALUES(description), content_url=VALUES(content_url), body=VALUES(body),
       duration=VALUES(duration), status='published'`,
      [stableId(`${course.id}:material:${index + 1}`), course.id, material.type, material.title, material.description, material.url ?? null, material.body, material.duration ?? null, index + 1],
    );
  }

  for (const [index, assessment] of assessmentsFor(course).entries()) {
    await db.execute(
      `INSERT INTO course_assessments
       (id, course_id, title, assessment_type, instructions, passing_score, max_attempts, sort_order, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published')
       ON DUPLICATE KEY UPDATE title=VALUES(title), assessment_type=VALUES(assessment_type),
       instructions=VALUES(instructions), passing_score=VALUES(passing_score),
       max_attempts=VALUES(max_attempts), status='published'`,
      [stableId(`${course.id}:assessment:${index + 1}`), course.id, assessment.title, assessment.type, assessment.instructions, assessment.passingScore, assessment.maxAttempts, index + 1],
    );
  }

  const concepts = conceptsFor(course);
  for (let index = 0; index < 50; index += 1) {
    const concept = concepts[index % concepts.length];
    const template = questionTemplates[index % questionTemplates.length](concept, course.title);
    const options = [...template.distractors];
    options.splice(index % 4, 0, template.correct);
    await db.execute(
      `INSERT INTO quiz_questions
       (id, course_id, module_index, question_text, options, correct_option, explanation, sort_order, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)
       ON DUPLICATE KEY UPDATE module_index=VALUES(module_index), question_text=VALUES(question_text),
       options=VALUES(options), correct_option=VALUES(correct_option), explanation=VALUES(explanation),
       sort_order=VALUES(sort_order), active=TRUE`,
      [stableId(`${course.id}:question:${index + 1}`), course.id, Math.floor(index / 10) + 1, template.question, JSON.stringify(options), template.correct, `${template.correct}. Apply this principle consistently and retain evidence of the decision.`, index + 1],
    );
  }
}

console.log(`Seeded ${courses.length} courses with 10 materials, 4 assessments, and 50 quiz questions each.`);
await db.end();
