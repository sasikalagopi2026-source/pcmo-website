import { FormEvent, useRef, useState } from "react";
import { MessageCircle, Send, Sparkles, X } from "lucide-react";
import { api } from "@/lib/api";

type Message = { role: "assistant" | "visitor"; text: string };
type AssistantResponse = { answer: string; suggestedQuestions: string[] };

const initialMessage = "Hello! I'm the PCMO assistant. I can help with membership, courses, certifications, community, and support.";
const initialSuggestions = ["What is PCMO membership?", "How do I enrol in a course?", "How can I contact PCMO support?"];

const SiteAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", text: initialMessage }]);
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    setMessages((current) => [...current, { role: "visitor", text: trimmed }]);
    setMessage("");
    setIsSending(true);
    try {
      const response = await api<AssistantResponse>("/api/assistant/messages", { method: "POST", body: JSON.stringify({ message: trimmed }) });
      setMessages((current) => [...current, { role: "assistant", text: response.answer }]);
      setSuggestions(response.suggestedQuestions);
    } catch (error) {
      const text = error instanceof Error ? error.message : "I could not respond right now. Please try again.";
      setMessages((current) => [...current, { role: "assistant", text }]);
    } finally {
      setIsSending(false);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void send(message);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans">
      {isOpen && (
        <section aria-label="PCMO assistant" className="mb-3 flex h-[min(38rem,calc(100vh-7rem))] w-[min(23rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <header className="flex items-center justify-between bg-[#0b3764] px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-red-600"><Sparkles className="h-5 w-5" /></span>
              <div>
                <h2 className="font-bold">PCMO Assistant</h2>
                <p className="text-xs text-white/70">Answers from PCMO help content</p>
              </div>
            </div>
            <button aria-label="Close assistant" onClick={() => setIsOpen(false)} className="rounded p-1 text-white/80 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
            {messages.map((item, index) => (
              <div key={`${item.role}-${index}`} className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${item.role === "visitor" ? "ml-auto rounded-br-sm bg-[#0b3764] text-white" : "rounded-bl-sm border border-slate-200 bg-white text-slate-700"}`}>{item.text}</div>
            ))}
            {isSending && <div className="w-fit rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">Thinking…</div>}
          </div>
          <div className="border-t bg-white p-3">
            {suggestions.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {suggestions.slice(0, 3).map((suggestion) => (
                  <button key={suggestion} onClick={() => void send(suggestion)} disabled={isSending} className="rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-left text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50">{suggestion}</button>
                ))}
              </div>
            )}
            <form onSubmit={submit} className="flex gap-2">
              <input ref={inputRef} value={message} onChange={(event) => setMessage(event.target.value)} maxLength={1200} placeholder="Ask a PCMO question…" className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0b3764] focus:ring-2 focus:ring-[#0b3764]/15" />
              <button aria-label="Send message" disabled={!message.trim() || isSending} className="grid h-10 w-10 place-items-center rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"><Send className="h-4 w-4" /></button>
            </form>
          </div>
        </section>
      )}
      <button onClick={() => { setIsOpen((open) => !open); window.setTimeout(() => inputRef.current?.focus(), 0); }} aria-label={isOpen ? "Close PCMO assistant" : "Open PCMO assistant"} className="ml-auto flex h-14 items-center gap-2 rounded-full bg-red-600 px-5 font-bold text-white shadow-lg transition hover:bg-red-700 hover:shadow-xl"><MessageCircle className="h-5 w-5" /><span>{isOpen ? "Close" : "Ask PCMO"}</span></button>
    </div>
  );
};

export default SiteAssistant;
