import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Logo from "./components/Logo";
import AndyAgent from "./components/AndyAgent";
import App from "./pages/App";
import MaterialsDashboard from "./pages/materials/MaterialsDashboard";
import SolarWizard from "./pages/solar/SolarWizard";
import SupportChat from "./pages/support/SupportChat";
import AnalyticsDashboard from "./pages/analytics/AnalyticsDashboard";
import Contacts from "./pages/Contacts";

import "./styles.css";

const Root: React.FC = () => (
  <BrowserRouter>
    <div className="layout">
      <header className="header">
        <Link to="/">
          <Logo showText={true} />
        </Link>
        <nav className="nav">
          <Link to="/">Home</Link>
          <Link to="/materials">Materials</Link>
          <Link to="/solar">Solar Sizing</Link>
          <Link to="/support">Support</Link>
          <Link to="/analytics">Analytics</Link>
          <Link to="/contacts">Contact</Link>
        </nav>
      </header>
      <main className="main">
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/materials" element={<MaterialsDashboard />} />
          <Route path="/solar" element={<SolarWizard />} />
          <Route path="/support" element={<SupportChat />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="/contacts" element={<Contacts />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <div className="site-footer-inner">
          <span className="site-footer-label">This website was developed by</span>
          <span className="site-footer-name">Mampotje Mabusela</span>
          <span className="site-footer-dot">.</span>
        </div>
      </footer>
    </div>
    <AndyAgent />
  </BrowserRouter>
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);

