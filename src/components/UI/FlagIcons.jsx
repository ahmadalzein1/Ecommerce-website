import React from 'react';

export const FlagLB = ({ size = 20, className = "" }) => (
  <svg 
    width={size} 
    height={size * 0.66} 
    viewBox="0 0 18 12" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="18" height="12" fill="#fff"/>
    <rect width="18" height="3" fill="#ED1C24"/>
    <rect y="9" width="18" height="3" fill="#ED1C24"/>
    <path d="M9 3.5L11 8H7L9 3.5Z" fill="#00A651"/>
    <rect x="8.5" y="6" width="1" height="3" fill="#603913"/>
  </svg>
);

export const FlagTR = ({ size = 20, className = "" }) => (
  <svg 
    width={size} 
    height={size * 0.66} 
    viewBox="0 0 1200 800" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="1200" height="800" fill="#E30A17"/>
    <circle cx="450" cy="400" r="200" fill="#fff"/>
    <circle cx="500" cy="400" r="160" fill="#E30A17"/>
    <path d="M700 400 L582.4 438.2 L627.4 313.2 L522.6 313.2 L567.6 438.2 Z" fill="#fff" transform="translate(100,0) rotate(18, 700, 400)"/>
  </svg>
);
