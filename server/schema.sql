CREATE DATABASE IF NOT EXISTS pcmo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pcmo;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student','admin','super_admin') NOT NULL DEFAULT 'student',
  status ENUM('active','suspended','pending') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profiles (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  headline VARCHAR(255),
  bio TEXT,
  company VARCHAR(255),
  phone VARCHAR(80),
  location VARCHAR(255),
  avatar_url TEXT,
  cover_url TEXT,
  member_number VARCHAR(80) UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS specialties JSON;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS open_to JSON;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS links JSON;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS resume_text LONGTEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS resume_file_url VARCHAR(4000);

CREATE TABLE IF NOT EXISTS member_connections (
  id CHAR(36) PRIMARY KEY,
  requester_id CHAR(36) NOT NULL,
  recipient_id CHAR(36) NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'pending',
  message VARCHAR(500),
  responded_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_member_connection (requester_id,recipient_id),
  CONSTRAINT fk_connection_requester FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_connection_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS member_projects (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  role_title VARCHAR(255),
  organisation VARCHAR(255),
  description TEXT,
  skills JSON,
  project_url TEXT,
  started_on DATE,
  ended_on DATE,
  status VARCHAR(40) NOT NULL DEFAULT 'published',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_member_project_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS member_badges (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(80),
  color VARCHAR(40),
  issued_by VARCHAR(255) NOT NULL DEFAULT 'PCMO',
  issued_at DATE,
  status VARCHAR(40) NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_member_badge_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS member_recommendations (
  id CHAR(36) PRIMARY KEY,
  author_id CHAR(36) NOT NULL,
  recipient_id CHAR(36) NOT NULL,
  relationship VARCHAR(255),
  content TEXT NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_recommendation_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_recommendation_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS memberships (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  plan_name VARCHAR(120) NOT NULL,
  status ENUM('active','expired','cancelled','pending') NOT NULL DEFAULT 'active',
  starts_at DATE NOT NULL,
  ends_at DATE,
  stripe_customer_id VARCHAR(255),
  stripe_checkout_session_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_memberships_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


ALTER TABLE memberships ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS stripe_checkout_session_id VARCHAR(255);
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);

CREATE TABLE IF NOT EXISTS membership_plans (
  id CHAR(36) PRIMARY KEY,
  slug VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(12,2),
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  billing_period VARCHAR(80),
  benefits JSON,
  source_url TEXT NOT NULL,
  featured_image TEXT,
  status VARCHAR(80) NOT NULL DEFAULT 'published',
  synced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

ALTER TABLE membership_plans ADD COLUMN IF NOT EXISTS benefits JSON;
ALTER TABLE membership_plans ADD COLUMN IF NOT EXISTS page_eyebrow VARCHAR(255);
ALTER TABLE membership_plans ADD COLUMN IF NOT EXISTS page_tagline TEXT;
ALTER TABLE membership_plans ADD COLUMN IF NOT EXISTS page_audience TEXT;
ALTER TABLE membership_plans ADD COLUMN IF NOT EXISTS page_content LONGTEXT;
ALTER TABLE membership_plans ADD COLUMN IF NOT EXISTS page_sections JSON;

UPDATE membership_plans SET
  page_eyebrow = CASE slug
    WHEN 'student-membership' THEN 'For students' WHEN 'individual-membership' THEN 'For professionals'
    WHEN 'premium-membership' THEN 'Premium pathway' WHEN 'team-membership' THEN 'For teams'
    WHEN 'corporate-membership' THEN 'For organisations' WHEN 'lifetime-membership' THEN 'Permanent access' ELSE page_eyebrow END,
  page_tagline = CASE slug
    WHEN 'student-membership' THEN 'Build your foundation. Find your direction. Join the profession.'
    WHEN 'individual-membership' THEN 'The essential membership for continuous professional growth.'
    WHEN 'premium-membership' THEN 'Accelerated learning, deeper insight, and priority professional access.'
    WHEN 'team-membership' THEN 'Shared learning goals with visibility, reporting, and premium resources.'
    WHEN 'corporate-membership' THEN 'Organisation-wide capability development with analytics and control.'
    WHEN 'lifetime-membership' THEN 'One investment. Lifelong connection to professional opportunity.' ELSE page_tagline END,
  page_audience = CASE slug
    WHEN 'student-membership' THEN 'Students and early-career learners' WHEN 'individual-membership' THEN 'Independent working professionals'
    WHEN 'premium-membership' THEN 'Ambitious professionals and future leaders' WHEN 'team-membership' THEN 'Teams of up to 10 professionals'
    WHEN 'corporate-membership' THEN 'Organisations of up to 50 members' WHEN 'lifetime-membership' THEN 'Professionals seeking access without renewals' ELSE page_audience END,
  page_content = CASE slug
    WHEN 'student-membership' THEN 'Begin building professional knowledge before graduation. Connect classroom learning with practical project and contract management, explore career pathways, and grow alongside an international community.'
    WHEN 'individual-membership' THEN 'Strengthen your day-to-day practice with professional resources, meaningful connections, member pricing, digital credentials, and career tools designed for independent professionals.'
    WHEN 'premium-membership' THEN 'Move beyond the essentials with premium courses, advanced learning reports, verified certificates, and priority access to the events and insights shaping the profession.'
    WHEN 'team-membership' THEN 'Create a shared development experience for up to ten professionals. Align learning goals, monitor progress, use manager reports, and give every team member access to premium resources.'
    WHEN 'corporate-membership' THEN 'Build organisation-wide capability with structured learning pathways, corporate analytics, administrative controls, priority support, and access for up to fifty members.'
    WHEN 'lifetime-membership' THEN 'Secure permanent access to core professional resources, learning, digital certificates, community benefits, and member event pricing with one payment and no renewal.' ELSE page_content END,
  featured_image = CASE slug
    WHEN 'student-membership' THEN 'https://www.pcmo.world/website/spicimg/membership/1.jpeg'
    WHEN 'individual-membership' THEN 'https://www.pcmo.world/website/spicimg/membership/2.jpeg'
    WHEN 'premium-membership' THEN 'https://www.pcmo.world/website/assets/img/about/4.jpg'
    WHEN 'team-membership' THEN 'https://www.pcmo.world/website/spicimg/membership/3.jpeg'
    WHEN 'corporate-membership' THEN 'https://www.pcmo.world/website/assets/img/banner/executives-paying-attention-digital-tablet.jpg'
    WHEN 'lifetime-membership' THEN 'https://www.pcmo.world/website/spicimg/membership/retiree_membership.png' ELSE featured_image END,
  page_sections = CASE slug
    WHEN 'student-membership' THEN JSON_ARRAY(JSON_OBJECT('title','Learn','text','Access foundation courses and selected professional resources.'),JSON_OBJECT('title','Connect','text','Meet peers and professionals through the PCMO community.'),JSON_OBJECT('title','Prepare','text','Use the career roadmap to plan your next professional step.'))
    WHEN 'individual-membership' THEN JSON_ARRAY(JSON_OBJECT('title','Develop','text','Build relevant skills with professional learning resources.'),JSON_OBJECT('title','Validate','text','Receive digital certificates that demonstrate achievement.'),JSON_OBJECT('title','Advance','text','Use member pricing, networking, and career tools.'))
    WHEN 'premium-membership' THEN JSON_ARRAY(JSON_OBJECT('title','Go deeper','text','Access premium courses and advanced learning reports.'),JSON_OBJECT('title','Stand out','text','Use certificate verification to strengthen professional credibility.'),JSON_OBJECT('title','Get priority','text','Receive priority access to selected professional events.'))
    WHEN 'team-membership' THEN JSON_ARRAY(JSON_OBJECT('title','Align','text','Create shared learning paths for up to ten people.'),JSON_OBJECT('title','Track','text','Monitor team progress through a shared dashboard.'),JSON_OBJECT('title','Improve','text','Use manager reports to guide capability development.'))
    WHEN 'corporate-membership' THEN JSON_ARRAY(JSON_OBJECT('title','Scale','text','Develop up to fifty members through one organisational plan.'),JSON_OBJECT('title','Analyse','text','Use corporate analytics to understand learning progress.'),JSON_OBJECT('title','Control','text','Manage access and branded pathways with administrative tools.'))
    WHEN 'lifetime-membership' THEN JSON_ARRAY(JSON_OBJECT('title','One payment','text','No annual membership renewal.'),JSON_OBJECT('title','Permanent access','text','Continue using core courses and professional resources.'),JSON_OBJECT('title','Stay connected','text','Keep community, certificate, and event pricing benefits.')) ELSE page_sections END
WHERE slug IN ('student-membership','individual-membership','premium-membership','team-membership','corporate-membership','lifetime-membership');

CREATE TABLE IF NOT EXISTS courses (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  level VARCHAR(80) NOT NULL,
  duration VARCHAR(80),
  credits INT NOT NULL DEFAULT 0,
  category VARCHAR(120),
  instructor VARCHAR(255),
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  capacity INT NOT NULL DEFAULT 0,
  status ENUM('draft','waiting','published','archived') NOT NULL DEFAULT 'draft',
  preview_content JSON,
  thumbnail_url TEXT,
  expiry_date DATE,
  certificate_template VARCHAR(255),
  coupon_code VARCHAR(80),
  discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

ALTER TABLE courses ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS certificate_template VARCHAR(255);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(80);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0;


CREATE TABLE IF NOT EXISTS course_enrollments (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  course_id CHAR(36) NOT NULL,
  progress DECIMAL(5,2) NOT NULL DEFAULT 0,
  status ENUM('active','completed','cancelled') NOT NULL DEFAULT 'active',
  enrolled_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_viewed_at DATETIME,
  UNIQUE KEY uq_enrollment (user_id, course_id),
  CONSTRAINT fk_enrollments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_enrollments_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS course_materials (
  id CHAR(36) PRIMARY KEY,
  course_id CHAR(36) NOT NULL,
  material_type ENUM('video','study_guide','reading','worksheet','case_study') NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content_url TEXT,
  body LONGTEXT,
  duration VARCHAR(80),
  sort_order INT NOT NULL DEFAULT 0,
  status VARCHAR(80) NOT NULL DEFAULT 'published',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_course_material_order (course_id, sort_order),
  CONSTRAINT fk_materials_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS course_module_progress (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  course_id CHAR(36) NOT NULL,
  material_id CHAR(36) NOT NULL,
  completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_course_module_progress (user_id, material_id),
  KEY idx_module_progress_course (course_id),
  CONSTRAINT fk_module_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_module_progress_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_module_progress_material FOREIGN KEY (material_id) REFERENCES course_materials(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS course_assessments (
  id CHAR(36) PRIMARY KEY,
  course_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  assessment_type ENUM('knowledge_check','case_study','assignment','final_exam') NOT NULL,
  instructions TEXT NOT NULL,
  passing_score INT NOT NULL DEFAULT 70,
  max_attempts INT NOT NULL DEFAULT 3,
  timer_minutes INT NOT NULL DEFAULT 30,
  sort_order INT NOT NULL DEFAULT 0,
  status VARCHAR(80) NOT NULL DEFAULT 'published',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_course_assessment_order (course_id, sort_order),
  CONSTRAINT fk_assessments_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS certifications (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  course_id CHAR(36),
  title VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  designation VARCHAR(255),
  issuer VARCHAR(255) NOT NULL,
  credential_id VARCHAR(120),
  issue_date DATE,
  expiry_date DATE,
  status VARCHAR(80) NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_certifications_user_course (user_id, course_id),
  CONSTRAINT fk_certifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_certifications_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
);


ALTER TABLE certifications ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(255);
ALTER TABLE certifications ADD COLUMN IF NOT EXISTS designation VARCHAR(255);

CREATE TABLE IF NOT EXISTS events (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(80) NOT NULL,
  category VARCHAR(120),
  event_date DATE NOT NULL,
  event_time TIME,
  location VARCHAR(255),
  capacity INT NOT NULL DEFAULT 0,
  status VARCHAR(80) NOT NULL DEFAULT 'scheduled',
  meeting_url TEXT,
  recording_url TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_registrations (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  event_id CHAR(36) NOT NULL,
  status VARCHAR(80) NOT NULL DEFAULT 'registered',
  registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_event_registration (user_id, event_id),
  CONSTRAINT fk_event_reg_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_event_reg_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS expert_rooms (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  topic VARCHAR(255),
  description TEXT,
  expert_name VARCHAR(255) NOT NULL,
  expert_role VARCHAR(255),
  expert_avatar_url TEXT,
  format VARCHAR(80) NOT NULL DEFAULT 'Live Q&A',
  scheduled_at DATETIME NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 60,
  capacity INT NOT NULL DEFAULT 25,
  meeting_url TEXT,
  status VARCHAR(80) NOT NULL DEFAULT 'published',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expert_room_reservations (
  id CHAR(36) PRIMARY KEY,
  room_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  status VARCHAR(80) NOT NULL DEFAULT 'reserved',
  notes TEXT,
  reserved_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_expert_room_reservation (room_id, user_id),
  CONSTRAINT fk_expert_res_room FOREIGN KEY (room_id) REFERENCES expert_rooms(id) ON DELETE CASCADE,
  CONSTRAINT fk_expert_res_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS community_chat_rooms (
  id CHAR(36) PRIMARY KEY,
  slug VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(120),
  moderator_name VARCHAR(255),
  access_level VARCHAR(80) NOT NULL DEFAULT 'members',
  icon VARCHAR(80) NOT NULL DEFAULT 'messages',
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(80) NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS community_chat_messages (
  id CHAR(36) PRIMARY KEY,
  room_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  message TEXT NOT NULL,
  reply_to_id CHAR(36),
  status VARCHAR(80) NOT NULL DEFAULT 'published',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_chat_message_room FOREIGN KEY (room_id) REFERENCES community_chat_rooms(id) ON DELETE CASCADE,
  CONSTRAINT fk_chat_message_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_chat_message_reply FOREIGN KEY (reply_to_id) REFERENCES community_chat_messages(id) ON DELETE SET NULL
);

INSERT IGNORE INTO users (id,email,password_hash,role,status) VALUES
('44000000-0000-4000-8000-000000000001','ai-assistant@pcmo.world','SYSTEM_ACCOUNT_NO_LOGIN','admin','active');
INSERT IGNORE INTO profiles (id,user_id,display_name,headline,bio) VALUES
('44000000-0000-4000-8000-000000000002','44000000-0000-4000-8000-000000000001','PCMO AI Assistant','AI Community Guide','AI-generated guidance. Important decisions should be confirmed with a qualified PCMO expert.');

CREATE TABLE IF NOT EXISTS ai_chat_replies (
  id CHAR(36) PRIMARY KEY,
  room_id CHAR(36) NOT NULL,
  source_message_id CHAR(36) NOT NULL,
  response_message_id CHAR(36),
  model VARCHAR(120),
  status VARCHAR(80) NOT NULL,
  sensitivity_reason VARCHAR(255),
  response_text TEXT,
  error_message TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ai_reply_room FOREIGN KEY (room_id) REFERENCES community_chat_rooms(id) ON DELETE CASCADE,
  CONSTRAINT fk_ai_reply_source FOREIGN KEY (source_message_id) REFERENCES community_chat_messages(id) ON DELETE CASCADE,
  CONSTRAINT fk_ai_reply_response FOREIGN KEY (response_message_id) REFERENCES community_chat_messages(id) ON DELETE SET NULL
);

INSERT IGNORE INTO community_chat_rooms (id,slug,name,description,category,moderator_name,access_level,icon,featured,status) VALUES
('43000000-0000-4000-8000-000000000001','project-delivery-lounge','Project Delivery Lounge','Discuss planning, controls, delivery recovery, risk, and lessons from complex projects.','Project Management','Amina Rahman','members','briefcase',TRUE,'active'),
('43000000-0000-4000-8000-000000000002','contracts-claims-desk','Contracts & Claims Desk','Exchange practical perspectives on FIDIC, variations, claims, negotiation, and dispute avoidance.','Contracts Management','David Mensah','members','file-text',TRUE,'active'),
('43000000-0000-4000-8000-000000000003','early-career-circle','Early Career Circle','A supportive space for students and emerging professionals to ask questions and build confidence.','Careers','PCMO Community Team','members','graduation-cap',FALSE,'active'),
('43000000-0000-4000-8000-000000000004','pmo-leadership-forum','PMO Leadership Forum','Explore governance, transformation, executive influence, portfolio decisions, and organisational value.','Leadership','Dr. Leila Hassan','premium','users',TRUE,'active');

INSERT IGNORE INTO expert_rooms (id,title,topic,description,expert_name,expert_role,format,scheduled_at,duration_minutes,capacity,status) VALUES
('41000000-0000-4000-8000-000000000001','Project Controls Clinic','Planning, EVM & forecasting','Bring your planning, controls, and forecasting questions for a practical live clinic.','Amina Rahman','Senior Project Controls Director','Live Q&A','2026-08-06 18:00:00',60,30,'published'),
('41000000-0000-4000-8000-000000000002','Contracts Expert Desk','Claims, negotiation & FIDIC','Review real contract scenarios and explore practical options with an experienced commercial leader.','David Mensah','Commercial & Contracts Leader','Case review','2026-08-08 11:00:00',75,25,'published'),
('41000000-0000-4000-8000-000000000003','Leadership Roundtable','Influence, teams & governance','A facilitated small-group discussion for leaders navigating governance, teams, and transformation.','Dr. Leila Hassan','PMO Transformation Advisor','Small group','2026-08-11 19:00:00',60,15,'published');

CREATE TABLE IF NOT EXISTS subscriptions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  plan_name VARCHAR(120) NOT NULL,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(80) NOT NULL DEFAULT 'active',
  starts_at DATE,
  ends_at DATE,
  next_billing DATE,
  auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
  payment_method VARCHAR(120),
  stripe_customer_id VARCHAR(255),
  stripe_checkout_session_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_checkout_session_id VARCHAR(255);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);

CREATE TABLE IF NOT EXISTS invoices (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  subscription_id CHAR(36),
  invoice_number VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(80) NOT NULL DEFAULT 'pending',
  invoice_date DATE NOT NULL,
  due_date DATE,
  stripe_checkout_session_id VARCHAR(255),
  stripe_invoice_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_invoices_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_invoices_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL
);


ALTER TABLE invoices ADD COLUMN IF NOT EXISTS stripe_checkout_session_id VARCHAR(255);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS stripe_invoice_id VARCHAR(255);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);

CREATE TABLE IF NOT EXISTS refunds (
  id CHAR(36) PRIMARY KEY,
  invoice_id CHAR(36),
  user_id CHAR(36) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  status ENUM('pending','succeeded','failed') NOT NULL DEFAULT 'pending',
  stripe_refund_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  reason VARCHAR(255),
  processed_by CHAR(36),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_refunds_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_refunds_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(80) NOT NULL DEFAULT 'info',
  read_at DATETIME,
  action_url TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(80),
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  enquiry_type VARCHAR(120),
  audience VARCHAR(120),
  organization VARCHAR(255),
  role_title VARCHAR(255),
  membership_status VARCHAR(120),
  preferred_contact_method VARCHAR(80),
  urgency VARCHAR(80),
  consent BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSON,
  status ENUM('new','read','replied','archived') NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  responded_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_contact_messages_status (status),
  KEY idx_contact_messages_created (created_at)
);

ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS enquiry_type VARCHAR(120);
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS audience VARCHAR(120);
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS organization VARCHAR(255);
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS role_title VARCHAR(255);
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS membership_status VARCHAR(120);
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS preferred_contact_method VARCHAR(80);
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS urgency VARCHAR(80);
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS consent BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS metadata JSON;

CREATE TABLE IF NOT EXISTS website_pages (
  id CHAR(36) PRIMARY KEY,
  page_group ENUM('primary','additional') NOT NULL DEFAULT 'primary',
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  menu_label VARCHAR(120),
  summary TEXT,
  body LONGTEXT,
  hero_image TEXT,
  call_to_action_label VARCHAR(120),
  call_to_action_url TEXT,
  seo_title VARCHAR(255),
  seo_description TEXT,
  reference_url TEXT,
  reference_image_url TEXT,
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_website_pages_group_status (page_group, status),
  KEY idx_website_pages_sort (sort_order)
);

INSERT INTO website_pages
  (id, page_group, title, slug, menu_label, summary, body, hero_image, call_to_action_label, call_to_action_url, seo_title, seo_description, reference_url, reference_image_url, status, sort_order)
VALUES
  ('30000000-0000-4000-8000-000000000001', 'primary', 'About PCMO', 'about', 'About Us',
   'Advancing the professions of project and contracts management through knowledge, certification, collaboration, mentorship, and an inclusive global community.',
   'About Us\n\nWelcome to the Project and Contracts Management Organisation (PCMO), where we dedicate ourselves to advancing the professions of project and contracts management. At PCMO, we understand the pivotal role these disciplines play across industries, and we commit to fostering growth, innovation, and excellence in these fields. Our community includes professionals and students from the energy sector, infrastructure, IT, and beyond.\n\nWe serve the industry by providing forums for collaboration, mentorship, and best practices. We also provide skills validation through our globally recognized training and certification products and insights from world-class industry research. We are passionately committed to diversity and inclusion.\n\nJoin the PCMO Community Today\n\nReady to take your project and contracts management skills to the next level? Join PCMO today and be part of a community driving excellence and innovation in the industry.\n\nWhy Choose Us?\n\nPCMO is home to respected and experienced professionals in the project and contracts management sectors. Our instructors, speakers, and mentors bring real-world insights, cutting-edge knowledge, and a passion for teaching.\n\nWhether you are seeking certification, enhancing specific skills, or exploring industry trends, PCMO offers interactive webinars, in-depth courses, and live workshops. Members also gain global networking opportunities, career resources, mentoring, and respected professional certifications.\n\nMission Statement\n\nOur mission is to empower and equip professionals and students with the knowledge, skills, and network they need to excel in project and contract management. We connect individuals to industry insights, educational opportunities, and a supportive community to drive personal and professional growth.\n\nVision Statement\n\nWe envision a world where professionals in project and contract management lead innovation and efficiency across sectors. PCMO cultivates an environment where members can learn, connect, and lead.\n\nOur Values\n\nExcellence — We maintain the highest standards across our programs, resources, and services.\n\nInclusion — We welcome varied perspectives and are committed to diversity.\n\nInnovation — We continually improve how knowledge is shared and professional skills are developed.\n\nCommunity — We create meaningful opportunities for collaboration, mentorship, and connection.\n\nWhy Become a Member?\n\nExclusive benefits designed to accelerate your career include expert-led sessions, structured certification guidance, mentoring from global industry leaders, and recognition for professional excellence.',
   'https://www.pcmo.world/website/assets/img/about/4.jpg', 'Join the PCMO Community', '/login?mode=register',
   'About PCMO | Project & Contracts Management Organisation',
   'Learn about PCMO, our mission, vision, values, professional community, certifications, and commitment to excellence in project and contracts management.',
   'https://pcmo.world/pages/about', 'https://www.pcmo.world/website/assets/img/about/5.jpg', 'published', 10)
ON DUPLICATE KEY UPDATE
  title=VALUES(title), menu_label=VALUES(menu_label), summary=VALUES(summary), body=VALUES(body), hero_image=VALUES(hero_image),
  call_to_action_label=VALUES(call_to_action_label), call_to_action_url=VALUES(call_to_action_url), seo_title=VALUES(seo_title),
  seo_description=VALUES(seo_description), reference_url=VALUES(reference_url), reference_image_url=VALUES(reference_image_url),
  status=VALUES(status), sort_order=VALUES(sort_order);

CREATE TABLE IF NOT EXISTS homepage_sections (
  id CHAR(36) PRIMARY KEY,
  section_key VARCHAR(120) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  eyebrow VARCHAR(255),
  body TEXT,
  image_url TEXT,
  action_label VARCHAR(120),
  action_url TEXT,
  items JSON,
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'published',
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_homepage_sections_status_sort (status, sort_order)
);

CREATE TABLE IF NOT EXISTS site_settings (
  id CHAR(36) PRIMARY KEY,
  setting_key VARCHAR(120) NOT NULL UNIQUE,
  value JSON NOT NULL,
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'published',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_site_settings_status (status)
);

CREATE TABLE IF NOT EXISTS navigation_items (
  id CHAR(36) PRIMARY KEY,
  location VARCHAR(80) NOT NULL DEFAULT 'header',
  parent_id CHAR(36) NULL,
  label VARCHAR(160) NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  target VARCHAR(32) NOT NULL DEFAULT '_self',
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'published',
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_navigation_items_location_status_sort (location, status, sort_order),
  CONSTRAINT fk_navigation_items_parent FOREIGN KEY (parent_id) REFERENCES navigation_items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS content_blocks (
  id CHAR(36) PRIMARY KEY,
  scope VARCHAR(120) NOT NULL,
  block_key VARCHAR(120) NOT NULL,
  title VARCHAR(255),
  eyebrow VARCHAR(255),
  body LONGTEXT,
  media_url TEXT,
  gallery JSON,
  video_url TEXT,
  button_label VARCHAR(120),
  button_url TEXT,
  seo JSON,
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_content_blocks_scope_key (scope, block_key),
  KEY idx_content_blocks_scope_status_sort (scope, status, sort_order)
);

CREATE TABLE IF NOT EXISTS faqs (
  id CHAR(36) PRIMARY KEY,
  category VARCHAR(120),
  question TEXT NOT NULL,
  answer LONGTEXT NOT NULL,
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_faqs_status_sort (status, sort_order)
);

CREATE TABLE IF NOT EXISTS testimonials (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role_title VARCHAR(255),
  organisation VARCHAR(255),
  quote LONGTEXT NOT NULL,
  avatar_url TEXT,
  rating TINYINT,
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_testimonials_status_sort (status, sort_order)
);

INSERT INTO site_settings (id,setting_key,value,status) VALUES
('32000000-0000-4000-8000-000000000001','brand',JSON_OBJECT('name','PCMO','tagline','Project & Contracts Management Organisation'),'published'),
('32000000-0000-4000-8000-000000000002','contact',JSON_OBJECT('phone','+44 753 425 6469','email','info@pcmo.world'),'published'),
('32000000-0000-4000-8000-000000000003','social_links',JSON_ARRAY(JSON_OBJECT('label','LinkedIn','url','https://www.linkedin.com/company/project-contracts-management-organisation/'),JSON_OBJECT('label','YouTube','url','https://youtube.com/@PCMOTRENDS?si=vkF1YTBq6W-BjpKn')),'published')
ON DUPLICATE KEY UPDATE value=VALUES(value),status=VALUES(status);

INSERT INTO navigation_items (id,location,parent_id,label,url,status,sort_order) VALUES
('32100000-0000-4000-8000-000000000001','header',NULL,'Home','/','published',10),
('32100000-0000-4000-8000-000000000002','header',NULL,'About Us','/pages/about','published',20),
('32100000-0000-4000-8000-000000000003','header',NULL,'Membership','/pages/membership_and_networking','published',30),
('32100000-0000-4000-8000-000000000004','header',NULL,'Certifications','/pages/certifications','published',40),
('32100000-0000-4000-8000-000000000005','header',NULL,'Resources','/pages/resources','published',50),
('32100000-0000-4000-8000-000000000006','header',NULL,'Connect','/pages/get_involved','published',60),
('32100000-0000-4000-8000-000000000007','footer-explore',NULL,'About PCMO','/pages/about','published',10),
('32100000-0000-4000-8000-000000000008','footer-explore',NULL,'Certifications','/pages/certifications','published',20),
('32100000-0000-4000-8000-000000000009','footer-support',NULL,'Contact Us','/contact','published',10),
('32100000-0000-4000-8000-000000000010','footer-support',NULL,'Privacy Policy','/pages/privacy','published',20)
ON DUPLICATE KEY UPDATE location=VALUES(location),parent_id=VALUES(parent_id),label=VALUES(label),url=VALUES(url),status=VALUES(status),sort_order=VALUES(sort_order);

INSERT INTO homepage_sections (id, section_key, title, eyebrow, body, image_url, action_label, action_url, items, status, sort_order) VALUES
('31000000-0000-4000-8000-000000000001','hero','Welcome to PCMO',NULL,'Join a global community dedicated to excellence in project and contracts management.','https://www.pcmo.world/website/assets/img/banner/businesspeople-working-office.jpg','Explore Membership','/pages/membership_and_networking',JSON_ARRAY(JSON_OBJECT('label','Join Us','url','/login?mode=register')),'published',10),
('31000000-0000-4000-8000-000000000002','about','Unlock Your True Potential','Project & Contracts Management Organization (PCMO)','Welcome to the Project & Contracts Management Organization (PCMO), where we dedicate ourselves to advancing the profession of project and contracts management. At PCMO, we connect professionals, practitioners, and academics to share best practices and drive positive change.','https://www.pcmo.world/website/assets/img/about/4.jpg','Discover More','/pages/about',NULL,'published',20),
('31000000-0000-4000-8000-000000000003','benefits','Why Choose Us',NULL,'PCMO is home to outstanding and experienced professionals in project and contracts management. Our instructors, speakers, and mentors are leaders in their fields.',NULL,NULL,NULL,JSON_ARRAY(JSON_OBJECT('title','Membership Advantages','text','Unlock exclusive resources, networking events, professional development opportunities, and a supportive community.'),JSON_OBJECT('title','Industry Insights','text','Stay ahead with tailored insights, emerging innovations, research reports, and expert knowledge.'),JSON_OBJECT('title','Elevate Your Skills','text','Advance your career with professional development programs, webinars, and certifications.'),JSON_OBJECT('title','Become a Member','text','Join PCMO and begin a more informed, connected, and successful professional journey.')),'published',30),
('31000000-0000-4000-8000-000000000004','learning','Engage, Learn, and Grow with PCMO',NULL,'Welcome to your hub for connection and engagement at PCMO, a global community dedicated to project and contracts management.',NULL,NULL,NULL,JSON_ARRAY(JSON_OBJECT('title','Podcasts','image','https://www.pcmo.world/website/spicimg/connect/podcast1.jpg','url','/pages/podcasts'),JSON_OBJECT('title','Webinars','image','https://www.pcmo.world/website/spicimg/connect/webinar.jpg','url','/pages/webinars'),JSON_OBJECT('title','Events','image','https://www.pcmo.world/website/spicimg/connect/Events.png','url','/pages/events')),'published',40),
('31000000-0000-4000-8000-000000000005','membership','Membership & Networking',NULL,'PCMO membership gives you access to a dynamic and forward-thinking institution dedicated to advancing the profession.',NULL,NULL,NULL,JSON_ARRAY(JSON_OBJECT('title','Student','image','https://www.pcmo.world/website/spicimg/membership/1.jpeg','url','/pages/student_membership'),JSON_OBJECT('title','Individual','image','https://www.pcmo.world/website/spicimg/membership/2.jpeg','url','/pages/individual_membership'),JSON_OBJECT('title','Retiree','image','https://www.pcmo.world/website/spicimg/membership/retiree_membership.png','url','/pages/retiree_membership'),JSON_OBJECT('title','Group','image','https://www.pcmo.world/website/spicimg/membership/3.jpeg','url','/pages/group_membership')),'published',50),
('31000000-0000-4000-8000-000000000006','resources','Empower Your Professional Growth with Our Comprehensive Resources',NULL,'Explore our extensive library of resources designed to provide the knowledge, insights, and support you need to excel in your field.',NULL,'Browse Library','/library',JSON_ARRAY(JSON_OBJECT('title','Whitepapers','image','https://www.pcmo.world/website/spicimg/resorces/White-Paper.jpg'),JSON_OBJECT('title','Research Papers','image','https://www.pcmo.world/website/spicimg/resorces/Research.png'),JSON_OBJECT('title','Articles','image','https://www.pcmo.world/website/spicimg/resorces/article.jpg'),JSON_OBJECT('title','E-Books','image','https://www.pcmo.world/website/spicimg/resorces/ebooks.jpeg'),JSON_OBJECT('title','Video Tutorials','image','https://www.pcmo.world/website/spicimg/resorces/video.jpg'),JSON_OBJECT('title','Templates & Tools','image','https://www.pcmo.world/website/spicimg/resorces/template.jpg')),'published',60),
('31000000-0000-4000-8000-000000000007','newsletter','Get the Latest Delivered to Your Inbox',NULL,'Subscribe to our newsletter and stay informed about the latest industry news, events, and opportunities.','https://www.pcmo.world/website/assets/img/banner/executives-paying-attention-digital-tablet.jpg','Join',NULL,NULL,'published',70),
('31000000-0000-4000-8000-000000000008','certifications','Featured Certifications',NULL,'Our featured certification programs recognize knowledge, skills, and professional competency through rigorous standards.',NULL,NULL,'/pages/certifications',JSON_ARRAY(JSON_OBJECT('title','PCMO Project+'),JSON_OBJECT('title','PCMO Network+'),JSON_OBJECT('title','PCMO Security+')),'published',80)
ON DUPLICATE KEY UPDATE title=VALUES(title), eyebrow=VALUES(eyebrow), body=VALUES(body), image_url=VALUES(image_url), action_label=VALUES(action_label), action_url=VALUES(action_url), items=VALUES(items), status=VALUES(status), sort_order=VALUES(sort_order);

CREATE TABLE IF NOT EXISTS course_notification_campaigns (
  id CHAR(36) PRIMARY KEY,
  course_id CHAR(36) NOT NULL,
  campaign_type ENUM('course_reminder','pending_reminder','newsletter') NOT NULL DEFAULT 'course_reminder',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  channels JSON NOT NULL,
  target_status VARCHAR(80) NOT NULL DEFAULT 'active',
  status ENUM('draft','sent') NOT NULL DEFAULT 'draft',
  recipient_count INT NOT NULL DEFAULT 0,
  scheduled_at DATETIME,
  sent_at DATETIME,
  created_by CHAR(36),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_course_campaign_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_course_campaign_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS library_contents (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  excerpt TEXT,
  body LONGTEXT,
  type VARCHAR(80) NOT NULL,
  category VARCHAR(120),
  subcategory VARCHAR(120),
  tags JSON,
  author VARCHAR(255),
  reviewer VARCHAR(255),
  status VARCHAR(80) NOT NULL DEFAULT 'draft',
  published_at DATETIME,
  expires_at DATETIME,
  featured_image TEXT,
  gallery JSON,
  media JSON,
  original_id CHAR(36),
  display_priority INT NOT NULL DEFAULT 0,
  scheduled_at DATETIME,
  attachments JSON,
  seo JSON,
  flags JSON,
  visibility JSON,
  sale_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  isbn VARCHAR(80),
  book_format VARCHAR(80),
  page_count INT,
  views INT NOT NULL DEFAULT 0,
  downloads INT NOT NULL DEFAULT 0,
  shares INT NOT NULL DEFAULT 0,
  reposts INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


ALTER TABLE library_contents ADD COLUMN IF NOT EXISTS gallery JSON;
ALTER TABLE library_contents ADD COLUMN IF NOT EXISTS media JSON;
ALTER TABLE library_contents ADD COLUMN IF NOT EXISTS original_id CHAR(36);
ALTER TABLE library_contents ADD COLUMN IF NOT EXISTS display_priority INT NOT NULL DEFAULT 0;
ALTER TABLE library_contents ADD COLUMN IF NOT EXISTS scheduled_at DATETIME;
ALTER TABLE library_contents ADD COLUMN IF NOT EXISTS sale_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE library_contents ADD COLUMN IF NOT EXISTS price DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE library_contents ADD COLUMN IF NOT EXISTS currency CHAR(3) NOT NULL DEFAULT 'USD';
ALTER TABLE library_contents ADD COLUMN IF NOT EXISTS isbn VARCHAR(80);
ALTER TABLE library_contents ADD COLUMN IF NOT EXISTS book_format VARCHAR(80);
ALTER TABLE library_contents ADD COLUMN IF NOT EXISTS page_count INT;

CREATE TABLE IF NOT EXISTS book_purchases (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  book_id CHAR(36) NOT NULL,
  status ENUM('pending','paid','cancelled','refunded') NOT NULL DEFAULT 'pending',
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  stripe_checkout_session_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  purchased_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_book_purchase (user_id, book_id),
  CONSTRAINT fk_book_purchases_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_book_purchases_book FOREIGN KEY (book_id) REFERENCES library_contents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS book_cart_items (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  book_id CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_book_cart_item (user_id, book_id),
  CONSTRAINT fk_book_cart_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_book_cart_book FOREIGN KEY (book_id) REFERENCES library_contents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS library_media (
  id CHAR(36) PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(160) NOT NULL,
  size_bytes INT NOT NULL DEFAULT 0,
  url TEXT NOT NULL,
  category VARCHAR(120),
  uploaded_by CHAR(36),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_library_media_user FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS community_posts (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  category VARCHAR(120),
  image_url TEXT,
  status VARCHAR(80) NOT NULL DEFAULT 'published',
  views INT NOT NULL DEFAULT 0,
  likes INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_posts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS post_comments (
  id CHAR(36) PRIMARY KEY,
  post_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  parent_id CHAR(36),
  content TEXT NOT NULL,
  likes INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_comments_post FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_parent FOREIGN KEY (parent_id) REFERENCES post_comments(id) ON DELETE CASCADE
);

INSERT IGNORE INTO community_posts (id,user_id,title,content,category,status) VALUES
('45000000-0000-4000-8000-000000000001','44000000-0000-4000-8000-000000000001','How can project leaders protect delivery confidence when scope continues to evolve but the completion date cannot move?','Share the practical controls, stakeholder conversations, and trade-offs you would use to protect delivery confidence.','Featured Conversation','published'),
('45000000-0000-4000-8000-000000000002','44000000-0000-4000-8000-000000000001','Contract risk allocation','Where do you see risk allocation creating avoidable delivery tension, and how would you improve it?','Trending Conversation','published'),
('45000000-0000-4000-8000-000000000003','44000000-0000-4000-8000-000000000001','AI in project controls','Which project controls activities should AI support, and which decisions must remain human-led?','Trending Conversation','published'),
('45000000-0000-4000-8000-000000000004','44000000-0000-4000-8000-000000000001','Career transitions into PMO','What experience best prepares a professional to move successfully into a PMO role?','Trending Conversation','published'),
('45000000-0000-4000-8000-000000000005','44000000-0000-4000-8000-000000000001','Claims avoidance lessons','What early action has helped your team prevent a potential claim from escalating?','Trending Conversation','published'),
('45000000-0000-4000-8000-000000000006','44000000-0000-4000-8000-000000000001','Leading multicultural teams','Which leadership practices create trust and clarity across multicultural project teams?','Trending Conversation','published');

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  course_id CHAR(36) NOT NULL,
  attempt_number INT NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  passed BOOLEAN NOT NULL,
  answered_count INT NOT NULL,
  total_questions INT NOT NULL,
  completed_modules INT NOT NULL DEFAULT 0,
  module_progress JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_attempts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_attempts_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id CHAR(36) PRIMARY KEY,
  course_id CHAR(36) NOT NULL,
  module_index INT NOT NULL DEFAULT 0,
  question_text TEXT NOT NULL,
  options JSON NOT NULL,
  correct_option TEXT NOT NULL,
  explanation TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_questions_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS incorrect_answers (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  course_id CHAR(36) NOT NULL,
  question_text TEXT NOT NULL,
  selected_option TEXT,
  correct_option TEXT,
  module_index INT,
  reviewed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_answers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_answers_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS volunteer_opportunities (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(120),
  location VARCHAR(255),
  time_commitment VARCHAR(120),
  spots_available INT NOT NULL DEFAULT 0,
  status VARCHAR(80) NOT NULL DEFAULT 'open',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS volunteer_applications (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  opportunity_id CHAR(36) NOT NULL,
  status VARCHAR(80) NOT NULL DEFAULT 'submitted',
  hours_logged DECIMAL(8,2) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_volunteer_application (user_id, opportunity_id),
  CONSTRAINT fk_volunteer_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_volunteer_opportunity FOREIGN KEY (opportunity_id) REFERENCES volunteer_opportunities(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS volunteer_hour_logs (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  application_id CHAR(36) NOT NULL,
  opportunity_id CHAR(36) NOT NULL,
  service_date DATE NOT NULL,
  hours DECIMAL(6,2) NOT NULL,
  activity TEXT NOT NULL,
  evidence_url VARCHAR(500),
  status VARCHAR(80) NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by CHAR(36),
  reviewed_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_volunteer_hours_user (user_id),
  KEY idx_volunteer_hours_application (application_id),
  KEY idx_volunteer_hours_status (status),
  CONSTRAINT fk_volunteer_hours_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_volunteer_hours_application FOREIGN KEY (application_id) REFERENCES volunteer_applications(id) ON DELETE CASCADE,
  CONSTRAINT fk_volunteer_hours_opportunity FOREIGN KEY (opportunity_id) REFERENCES volunteer_opportunities(id) ON DELETE CASCADE,
  CONSTRAINT fk_volunteer_hours_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

INSERT IGNORE INTO volunteer_opportunities (id,title,description,category,location,time_commitment,spots_available,status) VALUES
('47000000-0000-4000-8000-000000000001','Emerging Professionals Mentor','Support early-career members through structured monthly mentoring, practical career guidance, and confidence-building conversations.','Mentoring','Hybrid · Dubai / Remote','12 hours',8,'open'),
('47000000-0000-4000-8000-000000000002','Community Event Coordinator','Help the PCMO team plan expert sessions, welcome participants, coordinate speakers, and prepare post-event feedback summaries.','Events','Remote','8 hours',5,'open'),
('47000000-0000-4000-8000-000000000003','Knowledge Library Reviewer','Review project and contracts management resources for quality, relevance, accessibility, and clear professional language.','Knowledge','Remote','10 hours',10,'open');

CREATE TABLE IF NOT EXISTS career_goals (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  progress INT NOT NULL DEFAULT 0,
  status VARCHAR(80) NOT NULL DEFAULT 'active',
  target_date DATE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_goals_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS skills (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(120),
  proficiency INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_skills_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS career_milestones (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(80) NOT NULL DEFAULT 'upcoming',
  target_date DATE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_milestones_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS job_recommendations (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  location VARCHAR(255),
  employment_type VARCHAR(120),
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
ALTER TABLE job_recommendations ADD COLUMN IF NOT EXISTS slug VARCHAR(255);
ALTER TABLE job_recommendations ADD COLUMN IF NOT EXISTS salary VARCHAR(120);
ALTER TABLE job_recommendations ADD COLUMN IF NOT EXISTS skills JSON;
ALTER TABLE job_recommendations ADD COLUMN IF NOT EXISTS requirements JSON;
ALTER TABLE job_recommendations ADD COLUMN IF NOT EXISTS responsibilities JSON;
ALTER TABLE job_recommendations ADD COLUMN IF NOT EXISTS apply_url TEXT;
ALTER TABLE job_recommendations ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE;

INSERT IGNORE INTO job_recommendations (id,slug,title,company,location,employment_type,description,salary,skills,requirements,responsibilities,apply_url,featured,active) VALUES
('42000000-0000-4000-8000-000000000001','senior-contracts-manager','Senior Contracts Manager','Global Infrastructure Partners','Dubai, UAE','Full time','Lead commercial and contractual strategy across major infrastructure programmes, managing claims, risk, negotiation, and stakeholder relationships.','Competitive',JSON_ARRAY('FIDIC','Claims','Negotiation'),JSON_ARRAY('10+ years in contracts or commercial management','Strong FIDIC contract knowledge','Excellent negotiation and stakeholder skills'),JSON_ARRAY('Lead contract administration and commercial governance','Manage claims, variations, and dispute avoidance','Coach project teams on contractual obligations'),'https://talentspecialist.org/all-job-search.html',TRUE,TRUE),
('42000000-0000-4000-8000-000000000002','project-controls-engineer','Project Controls Engineer','NorthStar Energy','Hybrid · Abu Dhabi','Full time','Support integrated planning, earned value, cost forecasting, and schedule risk across complex energy projects.','Competitive',JSON_ARRAY('Primavera P6','EVM','Risk'),JSON_ARRAY('5+ years in project controls','Advanced Primavera P6 capability','Experience with cost and schedule reporting'),JSON_ARRAY('Maintain integrated project schedules','Produce progress and forecast reporting','Support quantitative schedule risk reviews'),'https://talentspecialist.org/all-job-search.html',FALSE,TRUE),
('42000000-0000-4000-8000-000000000003','pmo-analyst','PMO Analyst','Crestline Consulting','Remote','Contract','Provide governance, reporting, portfolio insights, and decision support for a growing transformation portfolio.','Competitive',JSON_ARRAY('Reporting','Governance','Power BI'),JSON_ARRAY('3+ years in a PMO or project analyst role','Strong data visualisation capability','Clear written and verbal communication'),JSON_ARRAY('Maintain portfolio dashboards and governance packs','Track risks, actions, and delivery milestones','Improve reporting standards and data quality'),'https://talentspecialist.org/all-job-search.html',FALSE,TRUE);

CREATE TABLE IF NOT EXISTS account_preferences (
  user_id CHAR(36) PRIMARY KEY,
  notification_preferences JSON,
  privacy_settings JSON,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_preferences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS admin_modules (
  id CHAR(36) PRIMARY KEY,
  section VARCHAR(120) NOT NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(80),
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_records (
  id CHAR(36) PRIMARY KEY,
  module_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(80) NOT NULL DEFAULT 'active',
  owner VARCHAR(255),
  details JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_admin_records_module FOREIGN KEY (module_id) REFERENCES admin_modules(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36),
  action VARCHAR(120) NOT NULL,
  resource VARCHAR(120) NOT NULL,
  resource_id CHAR(36),
  details JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS admin_activity_access (
  id CHAR(36) PRIMARY KEY,
  activity VARCHAR(255) NOT NULL,
  section ENUM('Marketing','Admin','Revenue','Analytics') NOT NULL,
  owner_role VARCHAR(120) NOT NULL,
  access_level ENUM('full','approve','edit','export','view') NOT NULL DEFAULT 'view',
  database_table VARCHAR(120) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_admin_activity_access (activity, section, owner_role)
);

CREATE TABLE IF NOT EXISTS member_activity_events (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36),
  activity_type VARCHAR(120) NOT NULL,
  resource VARCHAR(120) NOT NULL,
  resource_id CHAR(36),
  metadata JSON,
  occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_member_activity_type (activity_type),
  KEY idx_member_activity_occurred (occurred_at),
  CONSTRAINT fk_member_activity_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

INSERT IGNORE INTO admin_activity_access
  (id, activity, section, owner_role, access_level, database_table)
VALUES
  ('10000000-0000-4000-8000-000000000001', 'Campaign and discount management', 'Marketing', 'Marketing Admin', 'edit', 'admin_records'),
  ('10000000-0000-4000-8000-000000000002', 'Course publishing and approvals', 'Admin', 'Super Admin', 'full', 'courses'),
  ('10000000-0000-4000-8000-000000000003', 'Member and role administration', 'Admin', 'Super Admin', 'full', 'users'),
  ('10000000-0000-4000-8000-000000000004', 'Invoice and subscription reporting', 'Revenue', 'Finance Admin', 'export', 'invoices'),
  ('10000000-0000-4000-8000-000000000005', 'Learning and engagement analytics', 'Analytics', 'Analytics Admin', 'view', 'member_activity_events');

INSERT IGNORE INTO admin_modules
  (id, section, title, slug, description, icon, sort_order, active)
VALUES
  ('20000000-0000-4000-8000-000000000001', 'Education', 'Course Forum', 'webinars/course_forums', 'Manage course forum spaces, moderation notes, and forum status.', 'MessageSquare', 40, TRUE),
  ('20000000-0000-4000-8000-000000000002', 'Education', 'Categories', 'education/categories', 'Manage education categories and taxonomy labels.', 'BookOpen', 60, TRUE),
  ('20000000-0000-4000-8000-000000000003', 'Forum', 'Forums', 'forums', 'Manage public forum channels and communities.', 'MessageSquare', 10, TRUE),
  ('20000000-0000-4000-8000-000000000004', 'Forum', 'Featured Topics', 'forums/featured_topics', 'Curate featured forum topics.', 'MessageSquare', 20, TRUE),
  ('20000000-0000-4000-8000-000000000005', 'Forum', 'Recommended Topics', 'forums/recommended_topics', 'Curate recommended forum topics.', 'MessageSquare', 30, TRUE),
  ('20000000-0000-4000-8000-000000000006', 'CRM', 'Reports', 'crm/reports', 'Manage CRM report definitions and follow-up notes.', 'FileText', 10, TRUE),
  ('20000000-0000-4000-8000-000000000007', 'CRM', 'Contact Messages', 'contacts', 'Track website contact messages and responses.', 'MessageSquare', 20, TRUE),
  ('20000000-0000-4000-8000-000000000008', 'Content', 'Pages', 'content/pages', 'Manage website pages.', 'FileText', 20, TRUE),
  ('20000000-0000-4000-8000-000000000009', 'Content', 'Additional Pages', 'content/additional_pages', 'Manage additional website pages.', 'FileText', 30, TRUE),
  ('20000000-0000-4000-8000-000000000010', 'Content', 'Testimonials', 'content/testimonials', 'Manage testimonials and approvals.', 'Users', 40, TRUE),
  ('20000000-0000-4000-8000-000000000011', 'Content', 'Localization', 'content/localization', 'Manage translation strings and language status.', 'Settings', 50, TRUE),
  ('20000000-0000-4000-8000-000000000012', 'Financial', 'Balances', 'financial/balances', 'Manage balance snapshots and finance notes.', 'CreditCard', 10, TRUE),
  ('20000000-0000-4000-8000-000000000013', 'Financial', 'Subscribe', 'financial/subscribe', 'Manage subscription offers and notes.', 'CreditCard', 30, TRUE),
  ('20000000-0000-4000-8000-000000000014', 'Marketing', 'Advertising Modal', 'advertising_modal', 'Manage advertising modal content and display status.', 'BellRing', 20, TRUE),
  ('20000000-0000-4000-8000-000000000015', 'Settings', 'Settings', 'settings', 'Manage admin settings records.', 'Settings', 10, TRUE);
CREATE TABLE IF NOT EXISTS member_credit_awards (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  course_id CHAR(36) NOT NULL,
  credits INT NOT NULL,
  awarded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_member_credit_course (user_id, course_id),
  CONSTRAINT fk_member_credit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_member_credit_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS course_payments (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  course_id CHAR(36) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(12) NOT NULL DEFAULT 'USD',
  status ENUM('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  stripe_checkout_session_id VARCHAR(255) UNIQUE,
  stripe_payment_intent_id VARCHAR(255),
  paid_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_course_payment_user_course (user_id, course_id),
  CONSTRAINT fk_course_payment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_course_payment_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);
