import React from "react";

const regionContact = [
  {
    region: "South Africa – Gauteng",
    address: "Cnr. Kwikkieweg & Kameeldrift Road, Roodeplaat, Pretoria, 0030, South Africa",
    phone: "+27 (0)12 335 5157",
    email: "info@chartwellroofing.co.za",
  },
  {
    region: "South Africa – Western Cape",
    address: "Unit 3 Malta Row, 11 Malta Road, Wetton, Cape Town",
    phone: "+27 (0)12 329 3788",
    email: "adminwc@chartwellroofing.co.za",
  },
];

const IconLocation: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const IconPhone: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const IconEmail: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const Contacts: React.FC = () => {
  return (
    <section>
      <h2 className="section-heading">Contact</h2>
      <p className="section-sub">
        Get in touch with our Gauteng and Western Cape offices.
      </p>
      <div className="contacts-grid">
        {regionContact.map((office) => (
          <div key={office.region} className="contact-card">
            <h3 className="contact-region">{office.region}</h3>
            <div className="contact-divider" />
            <div className="contact-row">
              <span className="contact-icon" aria-hidden>
                <IconLocation />
              </span>
              <span className="contact-text">{office.address}</span>
            </div>
            <div className="contact-row">
              <span className="contact-icon" aria-hidden>
                <IconPhone />
              </span>
              <a href={`tel:${office.phone.replace(/\s/g, "")}`} className="contact-link">
                {office.phone}
              </a>
            </div>
            <div className="contact-row">
              <span className="contact-icon" aria-hidden>
                <IconEmail />
              </span>
              <a href={`mailto:${office.email}`} className="contact-link">
                {office.email}
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Contacts;
