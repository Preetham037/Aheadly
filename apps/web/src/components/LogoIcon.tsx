import React from 'react';

export function LogoIcon({ className = "w-6 h-6", color = "currentColor" }: { className?: string, color?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill={color} 
      className={className}
    >
      {/* Center 4-point star with curved edges */}
      <path d="M12 2C12.5 7.5 16.5 11.5 22 12C16.5 12.5 12.5 16.5 12 22C11.5 16.5 7.5 12.5 2 12C7.5 11.5 11.5 7.5 12 2Z" />
      {/* 4 corner bursts */}
      <path d="M5.5 5.5L7.5 7.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M18.5 5.5L16.5 7.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M5.5 18.5L7.5 16.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M18.5 18.5L16.5 16.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
