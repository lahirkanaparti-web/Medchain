import React from 'react';

export default function LogoMark({ className = "w-7 h-7" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0F4C5C" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="crossGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e0eff3" />
        </linearGradient>
      </defs>
      
      {/* Outer Shield Path */}
      <path
        d="M24 4L8 10V22C8 32.5 14.8 41.8 24 44C33.2 41.8 40 32.5 40 22V10L24 4Z"
        fill="url(#shieldGrad)"
        rx="2"
      />
      
      {/* Inner Medical Cross / Chain Pill motif */}
      <path
        d="M21 15H27V21H33V27H27V33H21V27H15V21H21V15Z"
        fill="url(#crossGrad)"
        fillRule="evenodd"
      />
      
      {/* Center Security Lock Dot */}
      <circle cx="24" cy="24" r="2.5" fill="#0F4C5C" />
    </svg>
  );
}
