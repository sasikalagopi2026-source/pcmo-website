import AdminCrudPage from "@/components/AdminCrudPage";

const fields = [
  { key: "title", label: "Page title", required: true },
  { key: "slug", label: "URL slug", required: true },
  { key: "menu_label", label: "Menu label" },
  { key: "summary", label: "Summary", type: "textarea" as const },
  { key: "body", label: "Page content", type: "textarea" as const },
  { key: "hero_image", label: "Hero image URL" },
  { key: "call_to_action_label", label: "Button label" },
  { key: "call_to_action_url", label: "Button URL" },
  { key: "seo_title", label: "SEO title" },
  { key: "seo_description", label: "SEO description", type: "textarea" as const },
  { key: "reference_url", label: "PCMO World reference URL" },
  { key: "reference_image_url", label: "Reference image URL" },
  { key: "status", label: "Status", required: true },
  { key: "sort_order", label: "Sort order", type: "number" as const },
];

const AdminContentPages = ({ group }: { group: "primary" | "additional" }) => (
  <AdminCrudPage
    title={group === "primary" ? "Website Pages" : "Additional Website Pages"}
    description={group === "primary" ? "Manage the main informational pages shown on the PCMO website." : "Manage supporting, policy, and campaign pages."}
    resource="website-pages"
    hiddenValues={{ page_group: group }}
    fields={fields}
  />
);

export default AdminContentPages;
