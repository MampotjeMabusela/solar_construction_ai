import React from "react";

type Props = { className?: string; showText?: boolean };

const Logo: React.FC<Props> = ({ className = "", showText = true }) => (
  <div className={`logo-wrap ${className}`} aria-hidden>
    <svg
      className="logo-icon"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="24" cy="24" r="10" fill="currentColor" opacity="0.95" />
      <path
        d="M24 4v4M24 40v4M4 24h4M40 24h4M8.5 8.5l2.8 2.8M36.7 36.7l2.8 2.8M8.5 39.5l2.8-2.8M36.7 11.3l2.8-2.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M24 14c0-1.5 1.5-2 2.5-2s2.5.5 2.5 2v2c0 1.5-1.5 2-2.5 2s-2.5-.5-2.5-2v-2z"
        fill="currentColor"
        opacity="0.7"
      />
    </svg>
    {showText && (
      <span className="logo-text">
        Solar Construction <strong>AI</strong>
      </span>
    )}
  </div>
);

export default Logo;
