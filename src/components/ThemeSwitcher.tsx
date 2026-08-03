import { useEffect, useState } from "react";
import { Sun, Moon, Smile } from "lucide-react";

const THEMES = ["theme-light", "theme-dark", "theme-playful"] as const;

const labelFor = (theme: string) => {
  if (theme === "theme-light") return "Light";
  if (theme === "theme-dark") return "Dark";
  return "Playful";
};

const ThemeSwitcher = () => {
  const [theme, setTheme] = useState<string>(() => {
    try {
      return localStorage.getItem("pcmo-theme") || "theme-light";
    } catch {
      return "theme-light";
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    THEMES.forEach((t) => root.classList.remove(t));
    root.classList.add(theme);
    try {
      localStorage.setItem("pcmo-theme", theme);
    } catch {}
  }, [theme]);

  return (
    <div className="flex items-center gap-2">
      <button title="Light theme" onClick={() => setTheme("theme-light")} className={`p-1 rounded ${theme === "theme-light" ? "ring-2 ring-primary/50" : "hover:bg-primary-foreground/6"}`}>
        <Sun className="w-4 h-4 text-white" />
      </button>
      <button title="Dark theme" onClick={() => setTheme("theme-dark")} className={`p-1 rounded ${theme === "theme-dark" ? "ring-2 ring-primary/50" : "hover:bg-primary-foreground/6"}`}>
        <Moon className="w-4 h-4 text-white" />
      </button>
      <button title="Playful theme" onClick={() => setTheme("theme-playful")} className={`p-1 rounded ${theme === "theme-playful" ? "ring-2 ring-primary/50" : "hover:bg-primary-foreground/6"}`}>
        <Smile className="w-4 h-4 text-white" />
      </button>
    </div>
  );
};

export default ThemeSwitcher;
