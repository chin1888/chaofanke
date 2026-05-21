import React from 'react';

export type MembershipTier = 'standard' | 'gold' | 'platinum' | 'diamond';

interface MembershipBadgeProps {
  tier?: MembershipTier;
  className?: string;
}

const tierConfig = {
  standard: {
    label: 'Standard',
    bgGradient: 'from-gray-100 to-gray-200',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-300',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" stroke="#9CA3AF" strokeWidth="2" fill="none"/>
        <path d="M16 8L18.5 13.5H24.5L19.5 17.5L21.5 23L16 19.5L10.5 23L12.5 17.5L7.5 13.5H13.5L16 8Z" fill="#9CA3AF"/>
      </svg>
    ),
  },
  gold: {
    label: 'Gold',
    bgGradient: 'from-amber-50 to-amber-100',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-300',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" stroke="#D97706" strokeWidth="2" fill="none"/>
        <path d="M16 8L18.5 13.5H24.5L19.5 17.5L21.5 23L16 19.5L10.5 23L12.5 17.5L7.5 13.5H13.5L16 8Z" fill="#D97706"/>
        <circle cx="16" cy="16" r="5" fill="#F59E0B" opacity="0.3"/>
      </svg>
    ),
  },
  platinum: {
    label: 'Platinum',
    bgGradient: 'from-slate-100 to-slate-200',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-400',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" stroke="#64748B" strokeWidth="2" fill="none"/>
        <path d="M16 6L19 13H27L20.5 17.5L23 25L16 20.5L9 25L11.5 17.5L5 13H13L16 6Z" fill="#64748B"/>
        <polygon points="16,10 17.5,13.5 21,13.5 18,16 19,19.5 16,17.5 13,19.5 14,16 11,13.5 14.5,13.5" fill="#94A3B8"/>
      </svg>
    ),
  },
  diamond: {
    label: 'Diamond',
    bgGradient: 'from-blue-50 to-cyan-50',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-300',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" stroke="#2563EB" strokeWidth="2" fill="none"/>
        <path d="M16 6L22 13L16 25L10 13L16 6Z" fill="#3B82F6"/>
        <path d="M16 6L13 13H19L16 6Z" fill="#60A5FA"/>
        <path d="M10 13L16 25L13 13H10Z" fill="#1D4ED8"/>
        <path d="M22 13L16 25L19 13H22Z" fill="#1D4ED8"/>
      </svg>
    ),
  },
};

export default function MembershipBadge({ tier = 'standard', className = '' }: MembershipBadgeProps) {
  const config = tierConfig[tier];

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-gradient-to-r ${config.bgGradient} ${config.borderColor} ${className}`}
    >
      {config.icon}
      <span className={`font-bold text-sm ${config.textColor}`}>{config.label}</span>
    </div>
  );
}

export function MembershipIcon({ tier = 'standard', size = 32 }: { tier?: MembershipTier; size?: number }) {
  const config = tierConfig[tier];
  return (
    <div style={{ width: size, height: size }}>
      {React.cloneElement(config.icon as React.ReactElement, { width: size, height: size })}
    </div>
  );
}
