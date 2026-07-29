import { Globe2, Mail } from "lucide-react";

const DashboardFooter = () => (
  <footer className="border-t border-primary-foreground/10 bg-primary px-6 py-4 text-sm text-primary-foreground/70 lg:px-8">
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row">
      <p>Project &amp; Contracts Management Organisation</p>
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        <a
          href="https://www.pcmo.world"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 transition-colors hover:text-primary-foreground"
        >
          <Globe2 className="h-4 w-4" />
          www.pcmo.world
        </a>
        <a
          href="mailto:info@pcmo.world"
          className="inline-flex items-center gap-2 transition-colors hover:text-primary-foreground"
        >
          <Mail className="h-4 w-4" />
          info@pcmo.world
        </a>
      </div>
    </div>
  </footer>
);

export default DashboardFooter;
