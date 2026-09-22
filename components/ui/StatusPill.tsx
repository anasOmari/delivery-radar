'use client';

import React from 'react';

export type StatusTone = 'green' | 'red' | 'amber' | 'blue' | 'purple' | 'whatsapp';

interface StatusPillProps {
  tone?: StatusTone;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

/** Single status pill (replaces ad-hoc colored spans). */
export const StatusPill: React.FC<StatusPillProps> = ({ tone = 'green', icon, children }) => {
  return (
    <span className={`ui-status-pill ui-status-pill--${tone}`}>
      {icon}
      <span>{children}</span>
    </span>
  );
};

interface BannerProps {
  tone?: 'green' | 'red' | 'amber' | 'blue' | 'whatsapp';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

/** Single feedback banner (success / error / info). */
export const Banner: React.FC<BannerProps> = ({ tone = 'green', icon, children }) => {
  return (
    <div className={`ui-banner ui-banner--${tone}`}>
      {icon}
      <span>{children}</span>
    </div>
  );
};
