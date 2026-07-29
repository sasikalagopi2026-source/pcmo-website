import { useParams, useSearchParams } from "react-router-dom";
import AdminCrudPage, { type CrudField } from "@/components/AdminCrudPage";
import DashboardLayout from "@/components/DashboardLayout";

const configs: Record<string, { title: string; description: string; resource: string; fields: CrudField[] }> = {
  "site-settings": { title: "Website Settings", description: "Manage global identity, contact details, social links, footer copy, and default SEO as JSON values.", resource: "site-settings", fields: [{ key: "setting_key", label: "Setting key", required: true }, { key: "value", label: "Value (JSON)", type: "json", required: true }, { key: "status", label: "Status", required: true }] },
  "navigation-items": { title: "Menus & Navigation", description: "Create, reorder, publish, and nest header, footer, and utility menu links.", resource: "navigation-items", fields: [{ key: "location", label: "Location", required: true }, { key: "parent_id", label: "Parent item ID" }, { key: "label", label: "Label", required: true }, { key: "url", label: "Link URL", required: true }, { key: "description", label: "Description", type: "textarea" }, { key: "image_url", label: "Image URL" }, { key: "target", label: "Target" }, { key: "status", label: "Status", required: true }, { key: "sort_order", label: "Sort order", type: "number" }] },
  "content-blocks": { title: "Reusable Content Blocks", description: "Manage page sections, rich copy, galleries, video links, CTAs, and per-block SEO.", resource: "content-blocks", fields: [{ key: "scope", label: "Page scope", required: true }, { key: "block_key", label: "Block key", required: true }, { key: "title", label: "Title" }, { key: "eyebrow", label: "Eyebrow" }, { key: "body", label: "Rich content", type: "richtext" }, { key: "media_url", label: "Media URL" }, { key: "gallery", label: "Gallery (JSON)", type: "json" }, { key: "video_url", label: "Video URL" }, { key: "button_label", label: "Button label" }, { key: "button_url", label: "Button URL" }, { key: "seo", label: "SEO / Open Graph (JSON)", type: "json" }, { key: "status", label: "Status", required: true }, { key: "sort_order", label: "Sort order", type: "number" }] },
  faqs: { title: "FAQs", description: "Create, publish, archive, and order frequently asked questions.", resource: "faqs", fields: [{ key: "category", label: "Category" }, { key: "question", label: "Question", type: "textarea", required: true }, { key: "answer", label: "Answer", type: "richtext", required: true }, { key: "status", label: "Status", required: true }, { key: "sort_order", label: "Sort order", type: "number" }] },
  testimonials: { title: "Testimonials", description: "Manage customer stories displayed throughout the site.", resource: "testimonials", fields: [{ key: "name", label: "Name", required: true }, { key: "role_title", label: "Role" }, { key: "organisation", label: "Organisation" }, { key: "quote", label: "Quote", type: "richtext", required: true }, { key: "avatar_url", label: "Avatar URL" }, { key: "rating", label: "Rating", type: "number" }, { key: "status", label: "Status", required: true }, { key: "sort_order", label: "Sort order", type: "number" }] },
  "member-projects": { title:"Member Projects",description:"Moderate projects showcased on professional community profiles.",resource:"member-projects",fields:[{key:"user_id",label:"User ID",required:true},{key:"title",label:"Title",required:true},{key:"role_title",label:"Role"},{key:"organisation",label:"Organisation"},{key:"description",label:"Description",type:"textarea"},{key:"skills",label:"Skills (JSON)",type:"json"},{key:"project_url",label:"Project URL"},{key:"started_on",label:"Started",type:"date"},{key:"ended_on",label:"Ended",type:"date"},{key:"status",label:"Status",required:true}]},
  "member-badges": { title:"Member Badges",description:"Issue and manage verified PCMO community badges.",resource:"member-badges",fields:[{key:"user_id",label:"User ID",required:true},{key:"name",label:"Badge name",required:true},{key:"description",label:"Description",type:"textarea"},{key:"icon",label:"Icon"},{key:"color",label:"Colour"},{key:"issued_by",label:"Issuer"},{key:"issued_at",label:"Issued date",type:"date"},{key:"status",label:"Status"}]},
  "member-recommendations": { title:"Recommendations",description:"Review and publish professional recommendations.",resource:"member-recommendations",fields:[{key:"author_id",label:"Author ID",required:true},{key:"recipient_id",label:"Recipient ID",required:true},{key:"relationship",label:"Relationship"},{key:"content",label:"Recommendation",type:"textarea",required:true},{key:"status",label:"Status",required:true}]},
  "member-connections": { title:"Member Connections",description:"Audit connection invitations and accepted professional relationships.",resource:"member-connections",fields:[{key:"requester_id",label:"Requester ID",required:true},{key:"recipient_id",label:"Recipient ID",required:true},{key:"status",label:"Status",required:true},{key:"message",label:"Message",type:"textarea"},{key:"responded_at",label:"Responded at",type:"datetime-local"}]},
  "homepage-sections": {
    title: "Homepage Content", description: "Manage homepage section text, images, buttons, card data, visibility, and display order.", resource: "homepage-sections",
    fields: [
      { key: "section_key", label: "Section key", required: true }, { key: "title", label: "Title", required: true },
      { key: "eyebrow", label: "Small heading" }, { key: "body", label: "Content", type: "textarea" },
      { key: "image_url", label: "Image URL" }, { key: "action_label", label: "Button label" },
      { key: "action_url", label: "Button URL" }, { key: "items", label: "Cards/items (JSON)", type: "json" },
      { key: "status", label: "Status", required: true }, { key: "sort_order", label: "Sort order", type: "number" },
    ],
  },
  events: {
    title: "Events & Webinars", description: "Manage events, webinars, meetings, and recordings.", resource: "events",
    fields: [
      { key: "title", label: "Title", required: true }, { key: "description", label: "Description", type: "textarea" },
      { key: "event_type", label: "Type", required: true }, { key: "category", label: "Category" },
      { key: "event_date", label: "Date", type: "date", required: true }, { key: "event_time", label: "Time" },
      { key: "location", label: "Location" }, { key: "capacity", label: "Capacity", type: "number" },
      { key: "status", label: "Status", required: true }, { key: "meeting_url", label: "Meeting URL" }, { key: "recording_url", label: "Recording URL" },
    ],
  },
  "expert-rooms": {
    title: "Expert Community Rooms", description: "Schedule expert-led rooms, manage capacity, speakers, meeting links, and publication status.", resource: "expert-rooms",
    fields: [
      { key: "title", label: "Room title", required: true }, { key: "topic", label: "Topic" },
      { key: "description", label: "Description", type: "textarea" }, { key: "expert_name", label: "Expert name", required: true },
      { key: "expert_role", label: "Expert role" }, { key: "expert_avatar_url", label: "Expert avatar URL" },
      { key: "format", label: "Format", required: true }, { key: "scheduled_at", label: "Scheduled date and time", type: "datetime-local", required: true },
      { key: "duration_minutes", label: "Duration (minutes)", type: "number" }, { key: "capacity", label: "Seat capacity", type: "number" },
      { key: "meeting_url", label: "Private meeting URL" }, { key: "status", label: "Status", required: true },
    ],
  },
  "expert-room-reservations": {
    title: "Expert Room Reservations", description: "View and manage member seat reservations for expert community rooms.", resource: "expert-room-reservations",
    fields: [
      { key: "room_id", label: "Room ID", required: true }, { key: "user_id", label: "User ID", required: true },
      { key: "status", label: "Status", required: true }, { key: "notes", label: "Admin notes", type: "textarea" },
      { key: "reserved_at", label: "Reserved at", type: "datetime-local" },
    ],
  },
  "community-chat-rooms": {
    title: "Community Chat Rooms", description: "Create member discussion spaces, assign moderators, and control access and visibility.", resource: "community-chat-rooms",
    fields: [
      { key: "slug", label: "URL slug", required: true }, { key: "name", label: "Room name", required: true },
      { key: "description", label: "Description", type: "textarea" }, { key: "category", label: "Category" },
      { key: "moderator_name", label: "Moderator name" }, { key: "access_level", label: "Access level" },
      { key: "icon", label: "Icon name" }, { key: "featured", label: "Featured (1/0)", type: "number" }, { key: "status", label: "Status", required: true },
    ],
  },
  "community-posts": {
    title: "Community Conversations", description: "Create featured prompts, trending discussions, and moderate member posts shown across the website and portal.", resource: "community-posts",
    fields: [
      { key: "user_id", label: "Author user ID", required: true }, { key: "title", label: "Conversation title", required: true },
      { key: "content", label: "Prompt or post content", type: "textarea" }, { key: "category", label: "Category" },
      { key: "image_url", label: "Image URL" }, { key: "status", label: "Status", required: true },
      { key: "views", label: "Views", type: "number" }, { key: "likes", label: "Likes", type: "number" },
    ],
  },
  "post-comments": {
    title: "Conversation Replies", description: "Review and moderate replies contributed to community conversations.", resource: "post-comments",
    fields: [
      { key: "post_id", label: "Conversation ID", required: true }, { key: "user_id", label: "Author user ID", required: true },
      { key: "parent_id", label: "Parent reply ID" }, { key: "content", label: "Reply", type: "richtext", required: true },
      { key: "likes", label: "Likes", type: "number" },
    ],
  },
  "community-chat-messages": {
    title: "Chat Moderation", description: "Review, edit, hide, or remove member messages across community rooms.", resource: "community-chat-messages",
    fields: [
      { key: "room_id", label: "Room ID", required: true }, { key: "user_id", label: "User ID", required: true },
      { key: "message", label: "Message", type: "textarea", required: true }, { key: "reply_to_id", label: "Reply to message ID" },
      { key: "status", label: "Status", required: true },
    ],
  },
  "ai-chat-replies": {
    title: "AI Reply Audit", description: "Review automatic replies, escalations, model usage, and integration failures.", resource: "ai-chat-replies",
    fields: [
      { key: "room_id", label: "Room ID", required: true }, { key: "source_message_id", label: "Source message ID", required: true },
      { key: "response_message_id", label: "Response message ID" }, { key: "model", label: "Model" },
      { key: "status", label: "Status", required: true }, { key: "sensitivity_reason", label: "Escalation reason" },
      { key: "response_text", label: "AI response", type: "textarea" }, { key: "error_message", label: "Error", type: "textarea" },
    ],
  },
  certifications: {
    title: "Certificates", description: "Issue and update student certificates.", resource: "certifications",
    fields: [
      { key: "user_id", label: "User ID", required: true }, { key: "course_id", label: "Course ID" },
      { key: "title", label: "Title", required: true }, { key: "recipient_name", label: "Recipient name" },
      { key: "designation", label: "Designation" }, { key: "issuer", label: "Issuer", required: true },
      { key: "credential_id", label: "Credential ID" }, { key: "issue_date", label: "Issue date", type: "date" },
      { key: "expiry_date", label: "Expiry date", type: "date" }, { key: "status", label: "Status" },
    ],
  },
  "course-enrollments": {
    title: "Enrollment", description: "Manage course enrollments, progress, status, and last activity.", resource: "course-enrollments",
    fields: [
      { key: "user_id", label: "User ID", required: true }, { key: "course_id", label: "Course ID", required: true },
      { key: "progress", label: "Progress %", type: "number" }, { key: "status", label: "Status", required: true },
      { key: "enrolled_at", label: "Enrolled at", type: "datetime-local" }, { key: "last_viewed_at", label: "Last viewed", type: "datetime-local" },
    ],
  },
  memberships: {
    title: "Memberships", description: "Manage student membership periods and status.", resource: "memberships",
    fields: [
      { key: "user_id", label: "User ID", required: true }, { key: "plan_name", label: "Plan", required: true },
      { key: "status", label: "Status", required: true }, { key: "starts_at", label: "Starts", type: "date", required: true }, { key: "ends_at", label: "Ends", type: "date" },
    ],
  },
  "membership-plans": {
    title: "Membership Plans", description: "Create and publish the plans shown in the student membership panel.", resource: "membership-plans",
    fields: [
      { key: "slug", label: "Slug", required: true }, { key: "name", label: "Name", required: true },
      { key: "description", label: "Description", type: "textarea" }, { key: "price", label: "Price", type: "number" },
      { key: "currency", label: "Currency" }, { key: "billing_period", label: "Billing period" },
      { key: "benefits", label: "Benefits (JSON array)", type: "json" },
      { key: "source_url", label: "Action URL", required: true }, { key: "featured_image", label: "Featured image URL" },
      { key: "page_eyebrow", label: "Page small heading" }, { key: "page_tagline", label: "Page hero tagline", type: "textarea" },
      { key: "page_audience", label: "Designed-for audience", type: "textarea" }, { key: "page_content", label: "Page main content", type: "textarea" },
      { key: "page_sections", label: "Dynamic highlight cards (JSON)", type: "json" },
      { key: "status", label: "Status", required: true },
    ],
  },
  subscriptions: {
    title: "Subscriptions", description: "Manage billing subscriptions.", resource: "subscriptions",
    fields: [
      { key: "user_id", label: "User ID", required: true }, { key: "plan_name", label: "Plan", required: true },
      { key: "price", label: "Price", type: "number" }, { key: "currency", label: "Currency" }, { key: "status", label: "Status" },
      { key: "starts_at", label: "Starts", type: "date" }, { key: "ends_at", label: "Ends", type: "date" },
      { key: "next_billing", label: "Next billing", type: "date" }, { key: "auto_renew", label: "Auto renew (1/0)", type: "number" }, { key: "payment_method", label: "Payment method" },
    ],
  },
  invoices: {
    title: "Invoices", description: "Create and reconcile student invoices.", resource: "invoices",
    fields: [
      { key: "user_id", label: "User ID", required: true }, { key: "subscription_id", label: "Subscription ID" },
      { key: "invoice_number", label: "Invoice number", required: true }, { key: "description", label: "Description", type: "textarea" },
      { key: "amount", label: "Amount", type: "number", required: true }, { key: "currency", label: "Currency" },
      { key: "status", label: "Status" }, { key: "invoice_date", label: "Invoice date", type: "date" }, { key: "due_date", label: "Due date", type: "date" },
    ],
  },
  "event-registrations": {
    title: "Sales List", description: "Event registrations and sales-style participation records.", resource: "event-registrations",
    fields: [
      { key: "user_id", label: "User ID", required: true }, { key: "event_id", label: "Event ID", required: true },
      { key: "status", label: "Status", required: true }, { key: "registered_at", label: "Registered at", type: "datetime-local" },
    ],
  },
  volunteering: {
    title: "Volunteer Opportunities", description: "Publish opportunities and control capacity, availability, location, and required commitment.", resource: "volunteer-opportunities",
    fields: [
      { key: "title", label: "Title", required: true }, { key: "description", label: "Description", type: "textarea" },
      { key: "category", label: "Category" }, { key: "location", label: "Location" }, { key: "time_commitment", label: "Time commitment" },
      { key: "spots_available", label: "Spots", type: "number" }, { key: "status", label: "Status" },
    ],
  },
  "volunteer-applications": {
    title: "Volunteer Applications", description: "Review student applications. Set status to approved, active, rejected, or completed; the student is notified automatically.", resource: "volunteer-applications",
    fields: [
      { key: "user_id", label: "Student user ID", required: true }, { key: "opportunity_id", label: "Opportunity ID", required: true },
      { key: "status", label: "Review status", required: true }, { key: "hours_logged", label: "Approved hours", type: "number" },
    ],
  },
  "volunteer-hour-logs": {
    title: "Volunteer Hour Verification", description: "Verify dated service records and supporting evidence. Approved entries automatically update the student's volunteer total.", resource: "volunteer-hour-logs",
    fields: [
      { key: "user_id", label: "Student user ID", required: true }, { key: "application_id", label: "Application ID", required: true },
      { key: "opportunity_id", label: "Opportunity ID", required: true }, { key: "service_date", label: "Service date", type: "date", required: true },
      { key: "hours", label: "Hours", type: "number", required: true }, { key: "activity", label: "Work completed", type: "textarea", required: true },
      { key: "evidence_url", label: "Evidence URL" }, { key: "status", label: "Verification status", required: true },
      { key: "admin_notes", label: "Admin notes", type: "textarea" },
    ],
  },
  jobs: {
    title: "Job Recommendations", description: "Publish career opportunities.", resource: "jobs",
    fields: [
      { key: "slug", label: "URL slug", required: true }, { key: "title", label: "Title", required: true }, { key: "company", label: "Company" }, { key: "location", label: "Location" },
      { key: "employment_type", label: "Employment type" }, { key: "salary", label: "Salary" }, { key: "description", label: "Description", type: "textarea" },
      { key: "skills", label: "Skills (JSON array)", type: "json" }, { key: "requirements", label: "Requirements (JSON array)", type: "json" },
      { key: "responsibilities", label: "Responsibilities (JSON array)", type: "json" }, { key: "apply_url", label: "Application URL" },
      { key: "featured", label: "Featured (1/0)", type: "number" }, { key: "active", label: "Active (1/0)", type: "number" },
    ],
  },
  "quiz-questions": {
    title: "Quiz Questions", description: "Build course question banks.", resource: "quiz-questions",
    fields: [
      { key: "course_id", label: "Course ID", required: true }, { key: "module_index", label: "Module", type: "number" },
      { key: "question_text", label: "Question", type: "textarea", required: true }, { key: "options", label: "Options (JSON array)", type: "json", required: true },
      { key: "correct_option", label: "Correct option", required: true }, { key: "explanation", label: "Explanation", type: "textarea" },
      { key: "sort_order", label: "Sort order", type: "number" }, { key: "active", label: "Active (1/0)", type: "number" },
    ],
  },
  "course-materials": {
    title: "Course Modules", description: "Create and manage the learning modules shown to enrolled students.", resource: "course-materials",
    fields: [
      { key: "course_id", label: "Course ID", required: true }, { key: "material_type", label: "Module type", required: true },
      { key: "title", label: "Title", required: true }, { key: "description", label: "Description", type: "textarea" },
      { key: "content_url", label: "Content URL" }, { key: "body", label: "Module content", type: "textarea" },
      { key: "duration", label: "Duration" }, { key: "sort_order", label: "Sort order", type: "number" },
      { key: "status", label: "Status", required: true },
    ],
  },
  "course-discounts": {
    title: "Course Discounts", description: "Manage course coupons and discount percentages.", resource: "courses",
    fields: [
      { key: "title", label: "Course title", required: true }, { key: "slug", label: "Slug", required: true },
      { key: "coupon_code", label: "Coupon code" }, { key: "discount_percent", label: "Discount %", type: "number" },
      { key: "price", label: "Price", type: "number" }, { key: "status", label: "Status", required: true },
    ],
  },
  blog: {
    title: "Blog", description: "Manage blog content in the Library CMS table.", resource: "library",
    fields: [
      { key: "title", label: "Title", required: true }, { key: "slug", label: "Slug", required: true },
      { key: "excerpt", label: "Excerpt", type: "textarea" }, { key: "body", label: "Body", type: "textarea" },
      { key: "type", label: "Type", required: true }, { key: "category", label: "Category" },
      { key: "tags", label: "Tags (JSON)", type: "json" }, { key: "author", label: "Author" },
      { key: "status", label: "Status", required: true }, { key: "published_at", label: "Published at", type: "datetime-local" },
      { key: "featured_image", label: "Featured image URL" },
    ],
  },
};

const AdminResourceManager = ({ resourceOverride }: { resourceOverride?: string }) => {
  const { resource = "" } = useParams();
  const [searchParams] = useSearchParams();
  const key = resourceOverride ?? resource;
  const config = configs[key];
  if (!config) return <DashboardLayout><p className="text-destructive">Unknown admin resource.</p></DashboardLayout>;
  const courseId = searchParams.get("course_id");
  return <AdminCrudPage {...config} hiddenValues={courseId ? { course_id: courseId } : undefined} />;
};

export default AdminResourceManager;
