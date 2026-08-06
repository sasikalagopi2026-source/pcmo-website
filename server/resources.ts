export type ResourceConfig = {
  table: string;
  fields: string[];
  searchable?: string[];
  ownerField?: string;
  publicRead?: boolean;
  studentCreate?: boolean;
  studentUpdate?: boolean;
  orderBy?: string;
};

export const resources: Record<string, ResourceConfig> = {
  "website-activities": { table: "website_activity_records", fields: ["activity_type", "user_id", "user_name", "email", "submitted_data", "status", "ip_address", "user_agent", "notification_status", "notification_attempts", "notification_error", "notified_at"], searchable: ["activity_type", "user_name", "email", "status", "notification_status", "notification_error"], orderBy: "created_at" },
  "newsletter-subscribers": { table: "newsletter_subscribers", fields: ["email", "status", "source", "ip_address", "user_agent", "metadata", "subscribed_at"], searchable: ["email", "status", "source"], orderBy: "subscribed_at" },
  "member-projects": { table: "member_projects", fields: ["user_id","title","role_title","organisation","description","skills","project_url","started_on","ended_on","status"], searchable: ["title","organisation","description"], ownerField: "user_id", studentCreate: true, studentUpdate: true },
  "member-connections": { table: "member_connections", fields: ["requester_id","recipient_id","status","message","responded_at"], searchable: ["status","message"] },
  "member-badges": { table: "member_badges", fields: ["user_id","name","description","icon","color","issued_by","issued_at","status"], searchable: ["name","description"], ownerField: "user_id" },
  "member-recommendations": { table: "member_recommendations", fields: ["author_id","recipient_id","relationship","content","status"], searchable: ["content","relationship"] },
  courses: {
    table: "courses",
    fields: ["title", "slug", "description", "level", "duration", "credits", "category", "instructor", "price", "capacity", "status", "preview_content", "thumbnail_url", "expiry_date", "certificate_template", "coupon_code", "discount_percent"],
    searchable: ["title", "description", "category", "instructor"],
    publicRead: true,
  },
  "course-materials": {
    table: "course_materials",
    fields: ["course_id", "material_type", "title", "description", "content_url", "body", "duration", "sort_order", "status"],
    searchable: ["title", "description", "body"],
    publicRead: true,
  },
  "course-assessments": {
    table: "course_assessments",
    fields: ["course_id", "title", "assessment_type", "instructions", "passing_score", "max_attempts", "timer_minutes", "sort_order", "status"],
    searchable: ["title", "instructions"],
    publicRead: true,
  },
  "course-enrollments": {
    table: "course_enrollments",
    fields: ["user_id", "course_id", "progress", "status", "enrolled_at", "last_viewed_at"],
    searchable: ["status"],
    ownerField: "user_id",
    orderBy: "enrolled_at",
  },
  certifications: {
    table: "certifications",
    fields: ["user_id", "course_id", "title", "recipient_name", "designation", "issuer", "credential_id", "issue_date", "expiry_date", "status"],
    searchable: ["title", "recipient_name", "designation", "issuer", "credential_id"],
    ownerField: "user_id",
  },
  memberships: {
    table: "memberships",
    fields: ["user_id", "plan_name", "status", "starts_at", "ends_at", "stripe_customer_id", "stripe_checkout_session_id", "stripe_subscription_id", "stripe_payment_intent_id"],
    searchable: ["plan_name", "status"],
    ownerField: "user_id",
  },
  "membership-plans": {
    table: "membership_plans",
    fields: ["slug", "name", "description", "price", "currency", "billing_period", "benefits", "source_url", "featured_image", "page_eyebrow", "page_tagline", "page_audience", "page_content", "page_sections", "status", "synced_at"],
    searchable: ["name", "description", "billing_period"],
    publicRead: true,
  },
  events: {
    table: "events",
    fields: ["title", "description", "event_type", "category", "event_date", "event_time", "location", "capacity", "status", "meeting_url", "recording_url"],
    searchable: ["title", "description", "category", "location"],
    publicRead: true,
  },
  "expert-rooms": {
    table: "expert_rooms",
    fields: ["title", "topic", "description", "expert_name", "expert_role", "expert_avatar_url", "format", "scheduled_at", "duration_minutes", "capacity", "meeting_url", "status"],
    searchable: ["title", "topic", "description", "expert_name", "expert_role", "format", "status"],
    publicRead: true,
    orderBy: "scheduled_at",
  },
  "expert-room-reservations": {
    table: "expert_room_reservations",
    fields: ["room_id", "user_id", "status", "notes", "reserved_at"],
    searchable: ["status", "notes"],
    ownerField: "user_id",
    orderBy: "reserved_at",
  },
  "community-chat-rooms": {
    table: "community_chat_rooms",
    fields: ["slug", "name", "description", "category", "moderator_name", "access_level", "icon", "featured", "status"],
    searchable: ["name", "description", "category", "moderator_name", "access_level", "status"],
    publicRead: true,
  },
  "community-chat-messages": {
    table: "community_chat_messages",
    fields: ["room_id", "user_id", "message", "reply_to_id", "status"],
    searchable: ["message", "status"],
    ownerField: "user_id",
    orderBy: "created_at",
  },
  "ai-chat-replies": {
    table: "ai_chat_replies",
    fields: ["room_id", "source_message_id", "response_message_id", "model", "status", "sensitivity_reason", "response_text", "error_message"],
    searchable: ["model", "status", "sensitivity_reason", "response_text", "error_message"],
    orderBy: "created_at",
  },
  "event-registrations": {
    table: "event_registrations",
    fields: ["user_id", "event_id", "status", "registered_at"],
    searchable: ["status"],
    ownerField: "user_id",
    orderBy: "registered_at",
  },
  subscriptions: {
    table: "subscriptions",
    fields: ["user_id", "plan_name", "price", "currency", "status", "starts_at", "ends_at", "next_billing", "auto_renew", "payment_method", "stripe_customer_id", "stripe_checkout_session_id", "stripe_subscription_id", "stripe_payment_intent_id"],
    searchable: ["plan_name", "status"],
    ownerField: "user_id",
  },
  invoices: {
    table: "invoices",
    fields: ["user_id", "subscription_id", "invoice_number", "description", "amount", "currency", "status", "invoice_date", "due_date", "stripe_checkout_session_id", "stripe_invoice_id", "stripe_payment_intent_id"],
    searchable: ["invoice_number", "description", "status"],
    ownerField: "user_id",
  },
  refunds: {
    table: "refunds",
    fields: ["invoice_id", "user_id", "amount", "currency", "status", "stripe_refund_id", "stripe_charge_id", "reason", "processed_by", "created_at"],
    searchable: ["stripe_refund_id", "stripe_charge_id", "status"],
    ownerField: "user_id",
  },
  notifications: {
    table: "notifications",
    fields: ["user_id", "title", "message", "type", "read_at", "action_url"],
    searchable: ["title", "message", "type"],
    ownerField: "user_id",
    studentUpdate: true,
  },
  library: {
    table: "library_contents",
    fields: ["title", "slug", "excerpt", "body", "type", "category", "subcategory", "tags", "author", "reviewer", "status", "published_at", "expires_at", "featured_image", "gallery", "media", "attachments", "seo", "flags", "visibility", "sale_enabled", "price", "currency", "isbn", "book_format", "page_count", "original_id", "display_priority", "scheduled_at", "views", "downloads", "shares", "reposts"],
    searchable: ["title", "excerpt", "body", "category", "author"],
    publicRead: true,
  },
  "book-purchases": {
    table: "book_purchases",
    fields: ["user_id", "book_id", "status", "amount", "currency", "stripe_checkout_session_id", "stripe_payment_intent_id", "purchased_at"],
    searchable: ["status"],
    ownerField: "user_id",
    orderBy: "created_at",
  },
  "library-media": {
    table: "library_media",
    fields: ["filename", "original_name", "mime_type", "size_bytes", "url", "category", "uploaded_by"],
    searchable: ["filename", "original_name", "mime_type", "category"],
  },
  "community-posts": {
    table: "community_posts",
    fields: ["user_id", "title", "content", "category", "image_url", "status", "views", "likes"],
    searchable: ["title", "content", "category"],
    ownerField: "user_id",
    publicRead: true,
    studentCreate: true,
    studentUpdate: true,
  },
  "post-comments": {
    table: "post_comments",
    fields: ["post_id", "user_id", "parent_id", "content", "likes"],
    searchable: ["content"],
    ownerField: "user_id",
    publicRead: true,
    studentCreate: true,
    studentUpdate: true,
  },
  "quiz-questions": {
    table: "quiz_questions",
    fields: ["course_id", "module_index", "question_text", "options", "correct_option", "explanation", "sort_order", "active"],
    searchable: ["question_text"],
  },
  "quiz-attempts": {
    table: "quiz_attempts",
    fields: ["user_id", "course_id", "attempt_number", "score", "passed", "answered_count", "total_questions", "completed_modules", "module_progress"],
    ownerField: "user_id",
    studentCreate: true,
    orderBy: "created_at",
  },
  "incorrect-answers": {
    table: "incorrect_answers",
    fields: ["user_id", "course_id", "question_text", "selected_option", "correct_option", "module_index", "reviewed"],
    orderBy: "created_at",
  },
  "volunteer-opportunities": {
    table: "volunteer_opportunities",
    fields: ["title", "description", "category", "location", "time_commitment", "spots_available", "status"],
    searchable: ["title", "description", "category", "location"],
    publicRead: true,
  },
  "volunteer-applications": {
    table: "volunteer_applications",
    fields: ["user_id", "opportunity_id", "status", "hours_logged"],
    ownerField: "user_id",
  },
  "volunteer-hour-logs": {
    table: "volunteer_hour_logs",
    fields: ["user_id", "application_id", "opportunity_id", "service_date", "hours", "activity", "evidence_url", "status", "admin_notes", "reviewed_by", "reviewed_at"],
    searchable: ["activity", "status"],
    ownerField: "user_id",
    studentCreate: false,
    orderBy: "created_at",
  },
  "career-goals": {
    table: "career_goals",
    fields: ["user_id", "title", "progress", "status", "target_date"],
    searchable: ["title", "status"],
    ownerField: "user_id",
    studentCreate: true,
    studentUpdate: true,
  },
  skills: {
    table: "skills",
    fields: ["user_id", "name", "category", "proficiency"],
    searchable: ["name", "category"],
    ownerField: "user_id",
    studentCreate: true,
    studentUpdate: true,
  },
  milestones: {
    table: "career_milestones",
    fields: ["user_id", "title", "status", "target_date", "sort_order"],
    searchable: ["title", "status"],
    ownerField: "user_id",
    studentCreate: true,
    studentUpdate: true,
  },
  jobs: {
    table: "job_recommendations",
    fields: ["slug", "title", "company", "location", "employment_type", "description", "salary", "skills", "requirements", "responsibilities", "apply_url", "featured", "active"],
    searchable: ["title", "company", "location"],
    publicRead: true,
  },
  "admin-modules": {
    table: "admin_modules",
    fields: ["section", "title", "slug", "description", "icon", "sort_order", "active"],
    searchable: ["section", "title", "description"],
  },
  "admin-records": {
    table: "admin_records",
    fields: ["module_id", "name", "status", "owner", "details"],
    searchable: ["name", "status", "owner"],
  },
  "website-pages": {
    table: "website_pages",
    fields: ["page_group", "title", "slug", "menu_label", "summary", "body", "hero_image", "call_to_action_label", "call_to_action_url", "seo_title", "seo_description", "reference_url", "reference_image_url", "status", "sort_order"],
    searchable: ["title", "slug", "menu_label", "summary", "body"],
    orderBy: "sort_order",
  },
  "homepage-sections": {
    table: "homepage_sections",
    fields: ["section_key", "title", "eyebrow", "body", "image_url", "action_label", "action_url", "items", "status", "sort_order"],
    searchable: ["section_key", "title", "eyebrow", "body"],
    orderBy: "sort_order",
  },
  "site-settings": {
    table: "site_settings",
    fields: ["setting_key", "value", "status"],
    searchable: ["setting_key"],
  },
  "navigation-items": {
    table: "navigation_items",
    fields: ["location", "parent_id", "label", "url", "description", "image_url", "target", "status", "sort_order"],
    searchable: ["location", "label", "url", "description"],
    orderBy: "sort_order",
  },
  "content-blocks": {
    table: "content_blocks",
    fields: ["scope", "block_key", "title", "eyebrow", "body", "media_url", "gallery", "video_url", "button_label", "button_url", "seo", "status", "sort_order"],
    searchable: ["scope", "block_key", "title", "body"],
    orderBy: "sort_order",
  },
  faqs: {
    table: "faqs",
    fields: ["category", "question", "answer", "status", "sort_order"],
    searchable: ["category", "question", "answer"],
    orderBy: "sort_order",
  },
  testimonials: {
    table: "testimonials",
    fields: ["name", "role_title", "organisation", "quote", "avatar_url", "rating", "status", "sort_order"],
    searchable: ["name", "role_title", "organisation", "quote"],
    orderBy: "sort_order",
  },
  "admin-activity-access": {
    table: "admin_activity_access",
    fields: ["activity", "section", "owner_role", "access_level", "database_table", "active"],
    searchable: ["activity", "section", "owner_role", "database_table"],
  },
  "member-activity-events": {
    table: "member_activity_events",
    fields: ["user_id", "activity_type", "resource", "resource_id", "metadata", "occurred_at"],
    searchable: ["activity_type", "resource"],
  },
};

export const jsonFields = new Set([
  "preview_content", "tags", "attachments", "seo", "flags", "visibility", "details", "options", "module_progress", "metadata", "channels", "benefits", "gallery", "media", "items", "page_sections", "value",
  "notification_preferences", "privacy_settings", "skills", "requirements", "responsibilities",
]);
