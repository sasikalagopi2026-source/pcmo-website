export type PublicPageSummary = {
  title: string;
  slug: string;
  menu_label?: string | null;
  summary?: string | null;
  hero_image?: string | null;
  page_group: "primary" | "additional";
  sort_order: number;
};

export type NavigationSection = { title: string; slugs: string[] };
export type NavigationGroup = { label: string; href: string; sections: NavigationSection[] };

export const navigationGroups: NavigationGroup[] = [
  {
    label: "Membership",
    href: "/pages/membership_and_networking",
    sections: [
      { title: "Become a member", slugs: ["membership_packages", "student_membership", "individual_membership", "professional_membership", "retiree_membership", "group_membership", "corporate_membership", "membership_faq"] },
      { title: "Networking at PCMO", slugs: ["membership_community", "job_community", "community_chat_rooms", "upcoming_networking_events", "join_the_conversation"] },
    ],
  },
  {
    label: "Certifications",
    href: "/pages/certifications",
    sections: [
      { title: "Certifications overview", slugs: ["certifications", "validate_certificate"] },
      { title: "Project management certifications", slugs: ["apmc", "project_management_essentials", "introduction_project_management", "project_management_fundamentals", "agile_project_management", "advanced_project_management", "strategic_project_management", "cpm_preparation", "program_management", "pmo_implementation"] },
      { title: "Contract management certifications", slugs: ["project_management_leadership", "introduction_contract_management", "contract_administration_fundamentals", "contract_negotiation_skills", "advanced_contract_management", "legal_aspects_contract_management", "relationship_management_contracts", "strategic_contract_management", "contract_ethics_compliance", "international_contract_management"] },
    ],
  },
  {
    label: "Resources",
    href: "/pages/resources",
    sections: [
      { title: "Knowledge centre", slugs: ["resources", "standards", "thought_leadership", "career_resources"] },
      { title: "Learn with PCMO", slugs: ["learning", "podcasts", "webinars", "events"] },
    ],
  },
  {
    label: "Connect",
    href: "/pages/get_involved",
    sections: [
      { title: "Community", slugs: ["membership_community", "community_chat_rooms", "join_the_conversation", "job_community"] },
      { title: "Participate", slugs: ["upcoming_networking_events", "get_involved", "organizations", "contact"] },
    ],
  },
];

export const groupForPage = (slug: string) => navigationGroups.find((group) => group.sections.some((section) => section.slugs.includes(slug)))?.label ?? "Explore";

