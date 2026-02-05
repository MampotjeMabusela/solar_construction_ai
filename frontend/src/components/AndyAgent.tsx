import React, { useState, useRef, useEffect } from "react";
import { apiUrl } from "../api";

type ChatMessage = {
  from: "user" | "assistant";
  text: string;
  sources?: { title: string; snippet: string }[];
};

const SUGGESTED_PROMPTS = [
  "What is the warranty on solar panels?",
  "How long is lead time for delivery?",
  "How do I get a quote?",
  "Do you do site inspections?",
  "Contact details for Gauteng?",
  "Solar system sizing and battery options",
  "Payment terms and finance",
  "Maintenance and servicing",
];

function renderAssistantText(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const segments = text.split(/(\*\*[^*]+\*\*)/g);
  segments.forEach((seg, segIdx) => {
    if (seg.startsWith("**") && seg.endsWith("**")) {
      parts.push(<strong key={`b-${segIdx}`}>{seg.slice(2, -2)}</strong>);
    } else {
      const lines = seg.split("\n");
      lines.forEach((line, i) => {
        if (i > 0) parts.push(<br key={`n-${segIdx}-${i}`} />);
        parts.push(<React.Fragment key={`t-${segIdx}-${i}`}>{line}</React.Fragment>);
      });
    }
  });
  return <>{parts}</>;
}

const AndyAgent: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (open && messages.length) scrollToBottom();
  }, [open, messages]);

  const sendMessage = async (questionOverride?: string) => {
    const question = (questionOverride ?? input.trim()).trim();
    if (!question) return;
    if (!questionOverride) setInput("");
    const userMsg: ChatMessage = { from: "user", text: question };
    const nextMessages: ChatMessage[] = [...messages, userMsg];
    setMessages(nextMessages);
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/rag/query"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      const assistantMsg: ChatMessage = {
        from: "assistant",
        text: data.answer ?? "I couldn't process that. Please try rephrasing or ask for a human.",
        sources: data.sources,
      };
      setMessages([...nextMessages, assistantMsg]);
    } catch {
      const errMsg: ChatMessage = {
        from: "assistant",
        text: "Something went wrong. Please try again or contact support via the Contact page.",
      };
      setMessages([...nextMessages, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="andy-widget">
      {open && (
        <div className="andy-panel">
          <div className="andy-header">
            <div className="andy-avatar" aria-hidden>A</div>
            <span className="andy-title">Andy – Support Agent</span>
            <button
              type="button"
              className="andy-close"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="andy-messages">
            {messages.length === 0 && (
              <>
                <div className="chat-message assistant">
                  <div className="chat-bubble">
                    Hi, I'm <strong>Andy</strong>. I can help with warranties, lead times, quotes, site inspections,
                    solar sizing, payment terms, maintenance, and contact details. Ask in your own words or pick a
                    suggestion below.
                  </div>
                </div>
                <div className="andy-suggestions">
                  <p className="andy-suggestions-label">Suggested questions:</p>
                  <div className="andy-suggestions-chips">
                    {SUGGESTED_PROMPTS.map((prompt, i) => (
                      <button
                        key={i}
                        type="button"
                        className="andy-chip"
                        onClick={() => sendMessage(prompt)}
                        disabled={loading}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            {messages.map((m, idx) => (
              <div key={idx} className={`chat-message ${m.from}`}>
                <div className="chat-bubble">
                  {m.from === "user" ? m.text : renderAssistantText(m.text)}
                  {m.sources && m.sources.length > 0 && (
                    <details className="andy-sources">
                      <summary>Sources</summary>
                      <ul>
                        {m.sources.map((s, i) => (
                          <li key={i}><strong>{s.title}:</strong> {s.snippet.slice(0, 120)}…</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-message assistant">
                <div className="chat-bubble andy-thinking">
                  <span className="andy-thinking-dot">.</span><span className="andy-thinking-dot">.</span><span className="andy-thinking-dot">.</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="andy-input-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about warranties, quotes, lead times, contact…"
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              aria-label="Message Andy"
            />
            <button type="button" onClick={() => sendMessage()} disabled={loading} aria-label="Send">
              Send
            </button>
          </div>
        </div>
      )}
      <button
        type="button"
        className="andy-toggle"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close Andy" : "Chat with Andy"}
        title="Chat with Andy – warranties, quotes, lead times, contact"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    </div>
  );
};

export default AndyAgent;
