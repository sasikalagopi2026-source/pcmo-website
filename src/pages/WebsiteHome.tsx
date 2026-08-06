import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  Award,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  FileCheck2,
  FileText,
  Mail,
  Network,
  PlayCircle,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import PcmoLogo from "@/components/PcmoLogo";
import PublicFooter from "@/components/PublicFooter";
import PublicNavigation from "@/components/PublicNavigation";
import { api } from "@/lib/api";

const site = "https://www.pcmo.world/";
const image = (path: string) => `${site}${path.replace(/^\//, "")}`;

const benefits: any[] = [
  { image: "website/spicimg/home/Membership Advantages.png", title: "Membership Advantages", text: "Unlock a world of benefits with PCMO membership. Gain access to exclusive resources, networking events, professional development opportunities, and a supportive community." },
  { image: "website/spicimg/home/Industry Insights.png", title: "Industry Insights", text: "Stay ahead of the curve with tailored insights and updates across emerging innovations, smart contracts, access to research reports, and expert knowledge." },
  { image: "website/spicimg/home/Elevate Your Skills.png", title: "Elevate Your Skills", text: "Advance your career with our comprehensive professional development programs, from webinars and certifications to networking." },
  { image: "website/spicimg/home/Become a member.png", title: "Become a Member", text: "Join PCMO today and take the first step towards a more informed, connected, and successful professional journey." },
];

const learning: any[] = [
  { title: "Podcasts", image: "website/spicimg/connect/podcast1.jpg", href: "/pages/podcasts", text: "Our podcast series is your gateway to the minds of industry experts and thought leaders." },
  { title: "Webinars", image: "website/spicimg/connect/webinar.jpg", href: "/pages/webinars", text: "Our webinars are interactive, informative, and designed to keep you at the forefront of your field." },
  { title: "Events", image: "website/spicimg/connect/Events.png", href: "/pages/events", text: "PCMO events offer opportunities to learn from experts and connect with professionals." },
];

const memberships: any[] = [
  { title: "Student", image: "website/spicimg/membership/1.jpeg", href: "/pages/student_membership", text: "Ideal for students eager to dive into project and contracts management." },
  { title: "Individual", image: "website/spicimg/membership/2.jpeg", href: "/pages/individual_membership", text: "Tailored for experienced professionals seeking advanced resources and networking." },
  { title: "Retiree", image: "website/spicimg/membership/retiree_membership.png", href: "/pages/retiree_membership", text: "Retiree members contribute knowledge and stay connected with the community." },
  { title: "Group", image: "website/spicimg/membership/3.jpeg", href: "/pages/group_membership", text: "Group memberships offer multiple individuals the same organisational benefits." },
];

const resources: any[] = [
  { title: "Whitepapers", image: "website/spicimg/resorces/White-Paper.jpg", icon: FileText },
  { title: "Research Papers", image: "website/spicimg/resorces/Research.png", icon: BookOpen },
  { title: "Articles", image: "website/spicimg/resorces/article.jpg", icon: FileText },
  { title: "E-Books", image: "website/spicimg/resorces/ebooks.jpeg", icon: BookOpen },
  { title: "Video Tutorials", image: "website/spicimg/resorces/video.jpg", icon: PlayCircle },
  { title: "Templates & Tools", image: "website/spicimg/resorces/template.jpg", icon: CheckCircle2 },
];

const journey = [
  { icon: Target, step: "01", title: "Discover", text: "Identify the membership, skills, and professional pathway that match your ambitions." },
  { icon: BookOpen, step: "02", title: "Learn", text: "Build practical capability through expert-led courses, resources, webinars, and events." },
  { icon: FileCheck2, step: "03", title: "Validate", text: "Demonstrate your knowledge through respected professional certifications." },
  { icon: BriefcaseBusiness, step: "04", title: "Lead", text: "Apply your expertise, expand your network, and create measurable industry impact." },
];

const SectionTitle = ({ eyebrow, title, text }: { eyebrow?: string; title: string; text?: string }) => (
  <div className="mx-auto max-w-4xl text-center">
    {eyebrow && <p className="text-xs font-bold uppercase tracking-[.22em] text-red-600">{eyebrow}</p>}
    <h2 className="mt-2 font-heading text-2xl font-extrabold uppercase tracking-tight text-[#0b3764] md:text-3xl">{title}</h2>
    {text && <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-slate-600">{text}</p>}
  </div>
);

const ReadMore = ({ to }: { to: string }) => (
  <Link to={to} className="mt-auto inline-flex items-center gap-2 self-center rounded bg-[#0b3764] px-4 py-2 text-xs font-bold text-white transition hover:bg-red-600">
    Read More <ArrowRight className="h-3.5 w-3.5" />
  </Link>
);

const WebsiteHome = () => {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState("");
  const [isNewsletterSubmitting, setIsNewsletterSubmitting] = useState(false);
  const submitNewsletter = async (event: FormEvent) => {
    event.preventDefault();
    const email = newsletterEmail.trim();
    if (!email) return setNewsletterStatus("Enter your email address to subscribe.");
    setIsNewsletterSubmitting(true);
    setNewsletterStatus("");
    try {
      await api("/api/newsletter-subscriptions", { method: "POST", body: JSON.stringify({ email }) });
      setNewsletterEmail("");
      setNewsletterStatus("You're subscribed, thank you!!!");
    } catch (error) {
      setNewsletterStatus(error instanceof Error ? error.message : "We could not complete your subscription. Please try again.");
    } finally {
      setIsNewsletterSubmitting(false);
    }
  };
  const hero = undefined;
  const about = undefined;
  const benefitContent = undefined;
  const learningContent = undefined;
  const membershipContent = undefined;
  const resourceContent = undefined;
  const newsletter = undefined;
  const certificationContent = undefined;
  const benefitItems = benefits;
  const learningItems = learning;
  const membershipItems = memberships;
  const resourceItems = resources;
  const certificationItems = [];

  return (
  <div className="min-h-screen bg-white text-slate-800">
    <PublicNavigation active="home" />

    <main>
      <section className="relative grid min-h-[620px] place-items-center overflow-hidden bg-slate-900 text-center text-white">
        <img src={hero?.image_url || image("website/assets/img/banner/businesspeople-working-office.jpg")} alt="Professionals collaborating around a table" className="absolute inset-0 h-full w-full object-cover opacity-65" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#061d35]/95 via-[#0b3764]/70 to-red-950/45" />
        <div className="absolute -right-32 -top-32 h-[430px] w-[430px] animate-pulse rounded-full border-[70px] border-red-600/15" />
        <div className="absolute -bottom-48 -left-28 h-[440px] w-[440px] rounded-full border-[60px] border-white/5" />
        <div className="pcmo-orbit absolute right-[8%] top-1/2 hidden h-64 w-64 -translate-y-1/2 rounded-full border border-dashed border-white/20 xl:block"><div className="absolute -top-5 left-1/2 grid h-11 w-11 -translate-x-1/2 place-items-center rounded-full bg-red-600 shadow-xl"><Award className="h-5 w-5"/></div><div className="absolute -bottom-5 left-1/2 grid h-11 w-11 -translate-x-1/2 place-items-center rounded-full bg-white text-[#0b3764] shadow-xl"><Users className="h-5 w-5"/></div></div>
        <div className="relative mx-auto max-w-5xl px-6 py-24 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <p className="mx-auto mb-6 inline-flex rounded-full border border-red-400/40 bg-red-600/15 px-5 py-2 text-xs font-bold uppercase tracking-[.22em] text-red-100">Learn · Connect · Lead</p>
          <h1 className="font-heading text-5xl font-extrabold leading-tight md:text-7xl">{hero?.title || <>Welcome to <span className="text-red-500">PCMO</span></>}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/90">{hero?.body || "Join a global community dedicated to excellence in project and contracts management."}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to={hero?.action_url || "/pages/membership_and_networking"} className="rounded border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold shadow-lg backdrop-blur transition hover:-translate-y-1 hover:bg-white/20">{hero?.action_label || "Explore Membership"}</Link>
            <Link to={newsletter?.action_url || "/login?mode=register"} className="rounded bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-1 hover:bg-red-700">{newsletter?.action_label || "Join Us"}</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[.8fr_1.2fr] md:items-center">
        <div className="relative mx-auto max-w-md">
          <div className="absolute -left-5 -top-5 h-24 w-24 border-l-4 border-t-4 border-dotted border-red-600" />
          <img src={about?.image_url || image("website/assets/img/about/4.jpg")} alt="PCMO professionals" className="relative h-80 w-full rounded object-cover shadow-xl transition duration-700 hover:scale-[1.02]" />
          <div className="pcmo-float absolute -bottom-6 -right-7 rounded-xl bg-[#0b3764] p-5 text-white shadow-2xl"><p className="text-2xl font-extrabold">Global</p><p className="text-xs text-white/65">knowledge community</p></div>
        </div>
        <div>
          <p className="text-sm font-bold uppercase text-red-600">{about?.eyebrow || "Project & Contracts Management Organization (PCMO)"}</p>
          <h2 className="mt-2 font-heading text-3xl font-extrabold text-[#0b3764]">{about?.title || "Unlock Your True Potential"}</h2>
          <p className="mt-5 text-sm leading-7 text-slate-600">{about?.body || "Welcome to the Project & Contracts Management Organization (PCMO), where we dedicate ourselves to advancing the profession of project and contracts management. At PCMO, we connect professionals, practitioners, and academics to share best practices and drive positive change."}</p>
          <h3 className="mt-5 font-bold text-[#0b3764]">Upgrade Your Skills</h3>
          <p className="mt-2 text-sm leading-7 text-slate-600">Combining the strengths of project management and contract management equips you with the skills professionals need to succeed and grow.</p>
          <div className="mt-4"><ReadMore to={about?.action_url || "/pages/about"} /></div>
        </div>
      </section>

      <section className="bg-slate-50 px-6 py-16">
        <SectionTitle title={benefitContent?.title || "Why Choose Us"} text={benefitContent?.body || "PCMO is home to outstanding and experienced professionals in project and contracts management. Our instructors, speakers, and mentors are leaders in their fields."} />
        <div className="mx-auto mt-10 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {(benefitItems.length ? benefitItems : benefits).map((item, index) => {
            const title = String(item.title ?? item.label ?? `Benefit ${index + 1}`);
            const text = String(item.text ?? "");
            const iconImage = String(item.image || item.icon || "website/spicimg/home/Membership Advantages.png");
            const url = String(item.url || item.action_url || "/pages/membership_and_networking");
            return <article key={title} className="group flex h-full flex-col rounded-xl border border-slate-100 bg-white p-7 text-center shadow-md transition duration-500 hover:-translate-y-3 hover:border-red-200 hover:shadow-2xl"><div className="mx-auto grid h-28 w-28 place-items-center rounded-2xl bg-slate-50 transition duration-500 group-hover:rotate-3 group-hover:scale-110 group-hover:bg-red-50"><img src={image(iconImage)} alt="" className="h-24 w-24 object-contain transition duration-500 group-hover:-rotate-3" /></div><h3 className="mt-6 text-lg font-extrabold text-[#0b3764]">{title}</h3><p className="mt-4 pb-6 text-sm leading-7 text-slate-600">{text}</p><Link to={url} className="mt-auto inline-flex items-center justify-center gap-2 text-xs font-bold text-[#0b3764] transition group-hover:text-red-600">READ MORE <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></Link></article>;
          })}
        </div>
      </section>

      <section className="px-6 py-16">
        <SectionTitle title={learningContent?.title || "Engage, Learn, and Grow with PCMO"} text={learningContent?.body || "Welcome to your hub for connection and engagement at PCMO. A global community of professionals and students dedicated to project and contracts management."} />
        <div className="mx-auto mt-10 grid max-w-6xl gap-6 md:grid-cols-3">
          {(learningItems.length ? learningItems : learning).map((item) => {
            const title = String(item.title ?? "Learn");
            const imageUrl = String(item.image ?? item.image_url ?? "website/spicimg/connect/podcast1.jpg");
            const href = String(item.url ?? item.href ?? "/pages/events");
            const text = String(item.text ?? item.description ?? "");
            return <article key={title} className="flex h-full flex-col overflow-hidden rounded bg-white shadow-md"><img src={image(imageUrl)} alt={title} className="h-52 w-full object-cover" /><div className="flex flex-1 flex-col p-6 text-center"><h3 className="text-xl font-bold text-[#0b3764]">{title}</h3><p className="mt-3 pb-5 text-sm leading-6 text-slate-600">{text}</p><ReadMore to={href} /></div></article>;
          })}
        </div>
      </section>

      <section className="bg-[#0b3764] px-6 py-10 text-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 text-center md:grid-cols-4">
          {[['15+','Countries of world class expertise'],['20+','Online courses with certification'],['500+','Projects & contracts management experts'],['15+','Learning methods & freely courses']].map(([value,label]) => <div key={label} className="border-white/20 md:border-r md:last:border-0"><p className="text-4xl font-extrabold">{value}</p><p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-white/70">{label}</p></div>)}
        </div>
      </section>

      <section className="relative overflow-hidden bg-white px-6 py-20">
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-red-50 blur-3xl" />
        <div className="relative mx-auto max-w-7xl">
          <SectionTitle eyebrow="Your professional journey" title="From ambition to industry impact" text="PCMO connects every stage of professional growth in one continuous pathway." />
          <div className="relative mt-14 grid gap-8 md:grid-cols-4">
            <div className="absolute left-[12%] right-[12%] top-14 hidden h-1 overflow-hidden rounded bg-slate-100 md:block"><div className="pcmo-progress h-full bg-gradient-to-r from-red-600 via-[#0b3764] to-red-600" /></div>
            {journey.map(({ icon: Icon, step, title, text }, index) => <article key={title} className="pcmo-rise group relative text-center" style={{ animationDelay: `${index * 140}ms` }}>
              <div className="relative z-10 mx-auto grid h-28 w-28 place-items-center rounded-full border-8 border-white bg-[#0b3764] text-white shadow-xl transition duration-500 group-hover:-translate-y-2 group-hover:rotate-3 group-hover:bg-red-600"><Icon className="h-10 w-10"/><span className="absolute -right-1 -top-1 grid h-8 w-8 place-items-center rounded-full bg-red-600 text-xs font-bold ring-4 ring-white group-hover:bg-[#0b3764]">{step}</span></div>
              <h3 className="mt-6 text-xl font-extrabold text-[#0b3764]">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
            </article>)}
          </div>
          <div className="mt-14 flex justify-center"><Link to="/pages/membership_and_networking" className="inline-flex items-center gap-2 rounded bg-red-600 px-7 py-4 font-bold text-white shadow-xl transition hover:-translate-y-1 hover:bg-red-700">Start your journey <ArrowRight className="h-5 w-5"/></Link></div>
        </div>
      </section>

      <section className="px-6 py-16">
        <SectionTitle title={membershipContent?.title || "Membership & Networking"} text={membershipContent?.body || "PCMO membership gives you access to a dynamic and forward-thinking institution dedicated to advancing the project and contracts management profession."} />
        <div className="mx-auto mt-10 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {(membershipItems.length ? membershipItems : memberships).map((item) => {
            const title = String(item.title ?? "Membership");
            const imageUrl = String(item.image ?? item.image_url ?? "website/spicimg/membership/1.jpeg");
            const href = String(item.url ?? item.href ?? "/pages/student_membership");
            const text = String(item.text ?? item.description ?? "");
            return <article key={title} className="flex h-full flex-col overflow-hidden rounded bg-white shadow-md"><img src={image(imageUrl)} alt={`${title} membership`} className="h-40 w-full object-cover" /><div className="flex flex-1 flex-col p-5 text-center"><h3 className="font-bold text-[#0b3764]">{title}</h3><p className="mt-3 pb-5 text-xs leading-6 text-slate-600">{text}</p><ReadMore to={href} /></div></article>;
          })}
        </div>
      </section>

      <section className="bg-slate-50 px-6 py-16">
        <SectionTitle title={resourceContent?.title || "Empower Your Professional Growth with Our Comprehensive Resources"} text={resourceContent?.body || "Explore our extensive library of resources designed to provide the knowledge, insights, and support you need to excel in your field."} />
        <div className="mx-auto mt-10 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(resourceItems.length ? resourceItems : resources).map((item) => {
            const title = String(item.title ?? "Resource");
            const src = String(item.image || item.image_url || "website/spicimg/resorces/White-Paper.jpg");
            const href = String(item.url ?? item.href ?? "/library");
            return <Link key={title} to={href} className="group overflow-hidden rounded bg-white shadow-md"><div className="relative"><img src={image(src)} alt={title} className="h-44 w-full object-cover transition duration-300 group-hover:scale-105" /><div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-[#0b3764]/95 px-4 py-2 text-sm font-bold text-white">{title}</div></div><p className="p-4 text-xs leading-5 text-slate-600">Discover practical resources created to support every stage of your professional journey.</p></Link>;
          })}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[1.4fr_.6fr]">
        <div><SectionTitle title="Upcoming Events Highlight" text="Stay ahead of industry trends and network with peers at our events, from insightful webinars to interactive seminars." /><div className="mt-8 overflow-hidden rounded shadow-lg"><img src={image("store/1047/handshake-close-up-executives-1280x640.jpg")} alt="Upcoming professional event" className="h-72 w-full object-cover" /></div></div>
        <div><h2 className="font-heading text-2xl font-extrabold uppercase text-[#0b3764]">Industry News</h2><div className="mt-6 space-y-5">{['Navigating the Challenges of Remote Contract Management: Tips and Best Practices','5 Essential Skills Every Project Manager Should Master'].map((title, i) => <article key={title} className="border-b pb-5"><div className="flex gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center bg-[#0b3764] text-center text-xs font-bold text-white">{i ? '28' : '20'}<br/>JUN</div><div><h3 className="text-sm font-bold text-[#0b3764]">{title}</h3><p className="mt-2 text-xs leading-5 text-slate-600">Insights and practical guidance from the PCMO professional community.</p></div></div></article>)}</div></div>
      </section>

      <section className="bg-slate-50 px-6 py-16">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.4fr_.6fr]">
          <div><SectionTitle title="Latest Blog" text="Explore our latest blog to discover fresh perspectives and practical insights." /><div className="mt-8 grid gap-5 sm:grid-cols-2">{[{title:'The Role of Artificial Intelligence in Optimizing Contract Management Processes',img:'/ai-contract-management.png'},{title:'Claims Avoidance – Unforeseen Site Conditions',img:'store/1047/construction-manager-with-house.jpeg.jpg'}].map(post => <article key={post.title} className="overflow-hidden rounded bg-white shadow"><img src={post.img.startsWith('/') ? post.img : image(post.img)} alt={post.title} className="h-44 w-full object-cover"/><div className="p-5"><h3 className="font-bold leading-6 text-[#0b3764]">{post.title}</h3><p className="mt-3 text-xs leading-5 text-slate-600">Explore insights, strategies, and new thinking from leaders across the profession.</p></div></article>)}</div></div>
          <aside className="rounded bg-white p-7 text-center shadow"><h2 className="font-heading text-xl font-extrabold uppercase text-[#0b3764]">Success Stories from Our Members</h2><p className="mt-8 text-6xl font-serif text-red-600">“</p><p className="mt-2 text-sm italic leading-7 text-slate-600">PCMO has been a game changer for me. The resources and network have helped me refine my skills and connect with industry leaders.</p><p className="mt-5 font-bold text-[#0b3764]">Honey Jane Albite</p></aside>
        </div>
      </section>

      <section className="relative overflow-hidden bg-slate-900 px-6 py-14 text-center text-white"><img src={newsletter?.image_url || image("website/assets/img/banner/executives-paying-attention-digital-tablet.jpg")} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20"/><div className="relative mx-auto max-w-3xl"><Mail className="mx-auto h-8 w-8 text-red-500"/><h2 className="mt-3 font-heading text-2xl font-extrabold uppercase">{newsletter?.title || "Get the Latest Delivered to Your Inbox"}</h2><p className="mt-3 text-sm text-white/70">{newsletter?.body || "Subscribe to our newsletter and stay informed about the latest industry news, events, and opportunities."}</p><form className="mx-auto mt-6 max-w-xl" onSubmit={submitNewsletter}><div className="flex"><input type="email" required value={newsletterEmail} onChange={(event) => setNewsletterEmail(event.target.value)} aria-label="Email address" placeholder="Your Email" className="min-w-0 flex-1 rounded-l px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-red-400"/><button disabled={isNewsletterSubmitting} className="rounded-r bg-red-600 px-6 font-bold text-white disabled:cursor-not-allowed disabled:opacity-70" type="submit">{isNewsletterSubmitting ? "Joining�" : newsletter?.action_label || "Join"}</button></div>{newsletterStatus && <p role="status" className="mt-3 text-sm font-medium text-white">{newsletterStatus}</p>}</form></div></section>

      <section className="px-6 py-16"><SectionTitle title={certificationContent?.title || "Featured Certifications"} text={certificationContent?.body || "Our featured certification programs recognize knowledge, skills, and professional competency through rigorous standards."}/><div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-3">{['PCMO Project+','PCMO Network+','PCMO Security+'].map((title)=><article key={title} className="rounded border p-7 text-center shadow-sm"><ShieldCheck className="mx-auto h-14 w-14 text-[#0b3764]"/><h3 className="mt-4 font-bold text-[#0b3764]">{title}</h3><p className="mt-3 text-xs leading-6 text-slate-600">Industry-endorsed certification designed to validate practical knowledge and professional capability.</p></article>)}</div></section>

      <section className="bg-slate-50 px-6 py-16"><SectionTitle title="ISO Certification"/><div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-3">{[1,2,3].map(n=><img key={n} src={image(`store/1/uploads/iso_certificates/${n}.jpg`)} alt={`ISO certification ${n}`} className="mx-auto w-full max-w-xs shadow-lg"/>)}</div></section>
    </main>

    <PublicFooter />
  </div>
  );
};

export default WebsiteHome;
