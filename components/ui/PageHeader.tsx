'use client';

import React from 'react';
import { useBranding } from '@/lib/BrandingContext';
import type { ModalIconTone } from './Modal';

interface PageHeaderProps {
  icon?: React.ReactNode;
  iconTone?: ModalIconTone;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  /** When true, title/subtitle fall back to the global brand name + tagline. */
  brand?: boolean;
}

/** Single page header for the whole product (branding-aware). */
export const PageHeader: React.FC<PageHeaderProps> = ({
  icon,
  iconTone = 'brand',
  title,
  subtitle,
  actions,
  brand = false,
}) => {
  const { appName, tagline } = useBranding();
  return (
    <div className="ui-page-header">
      <div className="ui-page-header-main">
        {icon && <div className={`ui-modal-icon ui-modal-icon--${iconTone}`}>{icon}</div>}
        <div>
          <h1>{brand ? (title ?? appName) : title}</h1>
          {(subtitle ?? (brand ? tagline : null)) && <p>{subtitle ?? tagline}</p>}
        </div>
      </div>
      {actions && <div className="ui-page-header-actions">{actions}</div>}
    </div>
  );
};
