import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Certifications from "./pages/Certifications.tsx";
import Courses from "./pages/Courses.tsx";
import Events from "./pages/Events.tsx";
import Subscriptions from "./pages/Subscriptions.tsx";
import Membership from "./pages/Membership.tsx";
import CareerNavigator from "./pages/CareerNavigator.tsx";
import Account from "./pages/Account.tsx";
import CommunityProfile from "./pages/CommunityProfile.tsx";
import EditProfile from "./pages/EditProfile.tsx";
import Volunteer from "./pages/Volunteer.tsx";
import VolunteerDetail from "./pages/VolunteerDetail.tsx";
import Webinars from "./pages/Webinars.tsx";
import CertificationQuiz from "./pages/CertificationQuiz.tsx";
import AdminCoursesPage from "./pages/AdminCoursesPage.tsx";
import AdminCourseWorkspace from "./pages/AdminCourseWorkspace.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import AdminModulePage from "./pages/AdminModulePage.tsx";
import AdminSectionOverview from "./pages/AdminSectionOverview.tsx";
import AdminTracker from "./pages/AdminTracker.tsx";
import AdminCourseReminders from "./pages/AdminCourseReminders.tsx";
import AdminLibraryManagement from "./pages/AdminLibraryManagement.tsx";
import Library from "./pages/Library.tsx";
import CourseDetail from "./pages/CourseDetail.tsx";
import EventDetail from "./pages/EventDetail.tsx";
import BlogPost from "./pages/BlogPost.tsx";
import EbookDetail from "./pages/EbookDetail.tsx";
import Bookstore from "./pages/Bookstore.tsx";
import InvoiceDetail from "./pages/InvoiceDetail.tsx";
import PostDetail from "./pages/PostDetail.tsx";
import Notifications from "./pages/Notifications.tsx";
import Login from "./pages/Login.tsx";
import AdminResourceManager from "./pages/AdminResourceManager.tsx";
import AdminUsersPage from "./pages/AdminUsersPage.tsx";
import AdminContactMessages from "./pages/AdminContactMessages.tsx";
import AdminContentPages from "./pages/AdminContentPages.tsx";
import WebsitePage from "./pages/WebsitePage.tsx";
import WebsiteHome from "./pages/WebsiteHome.tsx";
import AboutPage from "./pages/AboutPage.tsx";
import PublicMembership from "./pages/PublicMembership.tsx";
import MembershipPlanDetail from "./pages/MembershipPlanDetail.tsx";
import NetworkingPage from "./pages/NetworkingPage.tsx";
import CertificationHub from "./pages/CertificationHub.tsx";
import CertificateValidation from "./pages/CertificateValidation.tsx";
import ResourcesHub from "./pages/ResourcesHub.tsx";
import StandardsHub from "./pages/StandardsHub.tsx";
import ThoughtLeadershipHub from "./pages/ThoughtLeadershipHub.tsx";
import CareerResourcesHub from "./pages/CareerResourcesHub.tsx";
import LearningHub from "./pages/LearningHub.tsx";
import PodcastsHub from "./pages/PodcastsHub.tsx";
import WebinarsHub from "./pages/WebinarsHub.tsx";
import EventsHub from "./pages/EventsHub.tsx";
import NetworkingEventsHub from "./pages/NetworkingEventsHub.tsx";
import NetworkingEventDetail from "./pages/NetworkingEventDetail.tsx";
import GetInvolvedHub from "./pages/GetInvolvedHub.tsx";
import OrganizationsHub from "./pages/OrganizationsHub.tsx";
import ContactHub from "./pages/ContactHub.tsx";
import JobDetail from "./pages/JobDetail.tsx";
import ChatRoomDetail from "./pages/ChatRoomDetail.tsx";
import AdminCommunityChat from "./pages/AdminCommunityChat.tsx";
import AdminLogout from "./pages/AdminLogout.tsx";
import TermsConditionsPage from "./pages/TermsConditionsPage.tsx";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage.tsx";
import FaqsPage from "./pages/FaqsPage.tsx";
import PcmoSitemapPage from "./pages/PcmoSitemapPage.tsx";
import RequireAuth from "./components/RequireAuth.tsx";
import { AuthProvider } from "./hooks/useAuth.tsx";
import { useRealtime } from "./hooks/useRealtime.ts";
import SiteAssistant from "./components/SiteAssistant.tsx";

const queryClient = new QueryClient();

const RealtimeBridge = () => {
  useRealtime();
  return null;
};

const Student = ({ children }: { children: React.ReactNode }) => <RequireAuth student>{children}</RequireAuth>;
const Admin = ({ children }: { children: React.ReactNode }) => <RequireAuth admin>{children}</RequireAuth>;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <RealtimeBridge />
        <BrowserRouter>
          <SiteAssistant />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<WebsiteHome />} />
            <Route path="/pages/about" element={<AboutPage />} />
            <Route path="/pages/membership_and_networking" element={<NetworkingPage page="membership-networking" />} />
            <Route path="/pages/certifications" element={<CertificationHub />} />
            <Route path="/pages/validate_certificate" element={<CertificateValidation />} />
            <Route path="/pages/resources" element={<ResourcesHub />} />
            <Route path="/pages/standards" element={<StandardsHub />} />
            <Route path="/pages/thought_leadership" element={<ThoughtLeadershipHub />} />
            <Route path="/pages/career_resources" element={<CareerResourcesHub />} />
            <Route path="/pages/learning" element={<LearningHub />} />
            <Route path="/pages/podcasts" element={<PodcastsHub />} />
            <Route path="/pages/webinars" element={<WebinarsHub />} />
            <Route path="/pages/events" element={<EventsHub />} />
            <Route path="/pages/compare_all_memberships" element={<PublicMembership />} />
            <Route path="/pages/membership_packages" element={<PublicMembership />} />
            <Route path="/pages/student_membership" element={<PublicMembership audience="student" />} />
            <Route path="/pages/individual_membership" element={<PublicMembership audience="individual" />} />
            <Route path="/pages/retiree_membership" element={<PublicMembership audience="retiree" />} />
            <Route path="/pages/group_membership" element={<PublicMembership audience="group" />} />
            <Route path="/pages/membership_community" element={<NetworkingPage page="membership-community" />} />
            <Route path="/pages/job_community" element={<NetworkingPage page="job-community" />} />
            <Route path="/jobs/:slug" element={<JobDetail />} />
            <Route path="/pages/community_chat_rooms" element={<NetworkingPage page="chat-rooms" />} />
            <Route path="/community/chat/:slug" element={<Student><ChatRoomDetail /></Student>} />
            <Route path="/pages/upcoming_networking_events" element={<NetworkingEventsHub />} />
            <Route path="/pages/networking-events/:id" element={<NetworkingEventDetail />} />
            <Route path="/pages/get_involved" element={<GetInvolvedHub />} />
            <Route path="/pages/organizations" element={<OrganizationsHub />} />
            <Route path="/pages/contact" element={<ContactHub />} />
            <Route path="/pages/terms" element={<TermsConditionsPage />} />
            <Route path="/pages/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/pages/faqs" element={<FaqsPage />} />
            <Route path="/pages/sitemap" element={<PcmoSitemapPage />} />
            <Route path="/pages/join_the_conversation" element={<NetworkingPage page="conversation" />} />
            <Route path="/membership-plans/:slug" element={<MembershipPlanDetail />} />
            <Route path="/pages/:slug" element={<WebsitePage />} />
            <Route path="/contact" element={<ContactHub />} />
            <Route path="/dashboard" element={<Student><Index /></Student>} />
            <Route path="/student" element={<Student><Index /></Student>} />
            <Route path="/certifications" element={<Student><Certifications /></Student>} />
            <Route path="/courses" element={<Student><Courses /></Student>} />
            <Route path="/events" element={<Student><Events /></Student>} />
            <Route path="/networking-events" element={<Student><Events networkingOnly /></Student>} />
            <Route path="/subscriptions" element={<Student><Subscriptions /></Student>} />
            <Route path="/membership" element={<Student><Membership /></Student>} />
            <Route path="/career-navigator" element={<Student><CareerNavigator /></Student>} />
            <Route path="/account" element={<Student><Account /></Student>} />
            <Route path="/community-profile" element={<Student><CommunityProfile /></Student>} />
            <Route path="/edit-profile" element={<Student><EditProfile /></Student>} />
            <Route path="/volunteer" element={<Student><Volunteer /></Student>} />
            <Route path="/volunteer/:id" element={<Student><VolunteerDetail /></Student>} />
            <Route path="/webinars" element={<Student><Webinars /></Student>} />
            <Route path="/bookstore" element={<Student><Bookstore /></Student>} />
            <Route path="/library" element={<Student><Library /></Student>} />
            <Route path="/courses/:id" element={<Student><CourseDetail /></Student>} />
            <Route path="/events/:id" element={<Student><EventDetail /></Student>} />
            <Route path="/blog/:slug" element={<Student><BlogPost /></Student>} />
            <Route path="/ebook/:id" element={<Student><EbookDetail /></Student>} />
            <Route path="/invoices/:id" element={<Student><InvoiceDetail /></Student>} />
            <Route path="/community/post/:id" element={<Student><PostDetail /></Student>} />
            <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
            <Route path="/certification-quiz" element={<Student><CertificationQuiz /></Student>} />
            <Route path="/admin" element={<Admin><AdminDashboard /></Admin>} />
            <Route path="/admin/actions/:actionId" element={<Admin><AdminDashboard /></Admin>} />
            <Route path="/admin/marketing" element={<Admin><AdminSectionOverview /></Admin>} />
            <Route path="/admin/admin-section" element={<Admin><AdminSectionOverview /></Admin>} />
            <Route path="/admin/revenue" element={<Admin><AdminSectionOverview /></Admin>} />
            <Route path="/admin/analytics" element={<Admin><AdminSectionOverview /></Admin>} />
            <Route path="/admin/reminders" element={<Admin><AdminCourseReminders /></Admin>} />
            <Route path="/admin/library" element={<Admin><AdminLibraryManagement /></Admin>} />
            <Route path="/admin/quizzes" element={<Admin><AdminResourceManager resourceOverride="quiz-questions" /></Admin>} />
            <Route path="/admin/certificates" element={<Admin><AdminResourceManager resourceOverride="certifications" /></Admin>} />
            <Route path="/admin/enrollment" element={<Admin><AdminResourceManager resourceOverride="course-enrollments" /></Admin>} />
            <Route path="/admin/financial/sales" element={<Admin><AdminResourceManager resourceOverride="event-registrations" /></Admin>} />
            <Route path="/admin/marketing/course-discounts" element={<Admin><AdminResourceManager resourceOverride="course-discounts" /></Admin>} />
            <Route path="/admin/content/blog" element={<Admin><AdminResourceManager resourceOverride="blog" /></Admin>} />
            <Route path="/admin/logout" element={<Admin><AdminLogout /></Admin>} />
            <Route path="/admin/education/courses" element={<Admin><AdminCoursesPage /></Admin>} />
            <Route path="/admin/education/courses/create" element={<Admin><AdminCourseWorkspace mode="create" /></Admin>} />
            <Route path="/admin/education/courses/:courseId/details" element={<Admin><AdminCourseWorkspace mode="details" /></Admin>} />
            <Route path="/admin/education/courses/:courseId/edit" element={<Admin><AdminCourseWorkspace mode="edit" /></Admin>} />
            <Route path="/admin/education/courses/:courseId/modules" element={<Admin><AdminCourseWorkspace mode="modules" /></Admin>} />
            <Route path="/admin/education/courses/:courseId/assessments" element={<Admin><AdminCourseWorkspace mode="assessments" /></Admin>} />
            <Route path="/admin/education/courses/:courseId/questions" element={<Admin><AdminCourseWorkspace mode="questions" /></Admin>} />
            <Route path="/admin/education/courses/:courseId/members" element={<Admin><AdminCourseWorkspace mode="members" /></Admin>} />
            <Route path="/admin/education/courses/:courseId/reports" element={<Admin><AdminCourseWorkspace mode="reports" /></Admin>} />
            <Route path="/admin/education/courses/:courseId/notifications" element={<Admin><AdminCourseWorkspace mode="notifications" /></Admin>} />
            <Route path="/admin/manage/:resource" element={<Admin><AdminResourceManager /></Admin>} />
            <Route path="/admin/users" element={<Admin><AdminUsersPage /></Admin>} />
            <Route path="/admin/contacts" element={<Admin><AdminContactMessages /></Admin>} />
            <Route path="/admin/community-chat" element={<Admin><AdminCommunityChat /></Admin>} />
            <Route path="/admin/community-chat/:slug" element={<Admin><ChatRoomDetail /></Admin>} />
            <Route path="/admin/content/pages" element={<Admin><AdminContentPages group="primary" /></Admin>} />
            <Route path="/admin/content/homepage" element={<Admin><AdminResourceManager resourceOverride="homepage-sections" /></Admin>} />
            <Route path="/admin/content/settings" element={<Admin><AdminResourceManager resourceOverride="site-settings" /></Admin>} />
            <Route path="/admin/content/navigation" element={<Admin><AdminResourceManager resourceOverride="navigation-items" /></Admin>} />
            <Route path="/admin/content/blocks" element={<Admin><AdminResourceManager resourceOverride="content-blocks" /></Admin>} />
            <Route path="/admin/content/faqs" element={<Admin><AdminResourceManager resourceOverride="faqs" /></Admin>} />
            <Route path="/admin/content/additional_pages" element={<Admin><AdminContentPages group="additional" /></Admin>} />
            <Route path="/admin/incorrect-answers" element={<Admin><AdminTracker /></Admin>} />
            <Route path="/admin/*" element={<Admin><AdminModulePage /></Admin>} />
            <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
