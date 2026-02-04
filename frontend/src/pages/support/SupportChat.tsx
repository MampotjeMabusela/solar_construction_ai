import React from "react";

const SupportChat: React.FC = () => {
  return (
    <section>
      <h2 className="section-heading">Support</h2>
      <p className="section-sub">
        Get help with installations, warranties, lead times, quotes, and inspections.
      </p>
      <div className="card">
        <h3>Chat with Andy</h3>
        <p style={{ margin: "0 0 0.75rem" }}>
          <strong>Andy</strong> is your support agent. Use the chat button in the bottom-right
          corner of the screen to open a conversation. Andy can answer questions about:
        </p>
        <ul style={{ margin: "0 0 0.75rem", paddingLeft: "1.5rem" }}>
          <li>Warranties and guarantees</li>
          <li>Lead times and delivery</li>
          <li>Quotes and proposals</li>
          <li>Site inspections</li>
          <li>Installation guidelines</li>
        </ul>
        <p style={{ margin: 0, fontSize: "0.9375rem", color: "var(--text-secondary)" }}>
          The chat is available on every page. Click the orange button to start.
        </p>
      </div>
      <div className="card">
        <h3>Draft emails</h3>
        <p style={{ margin: 0 }}>
          Use the Support API to generate draft emails for inspection summaries or quote
          follow-ups. Contact your admin for access to the draft-email endpoint.
        </p>
      </div>
    </section>
  );
};

export default SupportChat;
