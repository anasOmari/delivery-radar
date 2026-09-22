'use client';

import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  hint?: React.ReactNode;
  action?: React.ReactNode;
}

/** Single empty-state block for lists, tables and search results. */
export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, hint, action }) => {
  return (
    <div className="ui-empty-state">
      {icon}
      <strong>{title}</strong>
      {hint && <span>{hint}</span>}
      {action}
    </div>
  );
};
