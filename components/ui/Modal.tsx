'use client';

import React from 'react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';
export type ModalIconTone = 'whatsapp' | 'brand' | 'amber' | 'red';

interface ModalProps {
  onClose: () => void;
  size?: ModalSize;
  icon?: React.ReactNode;
  iconTone?: ModalIconTone;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
  bodyStyle?: React.CSSProperties;
  bodyClassName?: string;
  children: React.ReactNode;
}

/**
 * Single modal shell for the whole product (replaces the modal-box /
 * modal-container / studio-card dialects). Visuals come from globals.css
 * tokens only — no inline colors or sizes.
 */
export const Modal: React.FC<ModalProps> = ({
  onClose,
  size = 'lg',
  icon,
  iconTone = 'whatsapp',
  title,
  subtitle,
  headerActions,
  footer,
  bodyStyle,
  bodyClassName,
  children,
}) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-box modal-${size}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title flex-align gap-2">
            {icon && (
              <div className={`ui-modal-icon ui-modal-icon--${iconTone}`}>
                {icon}
              </div>
            )}
            <div>
              <h3 className="ui-modal-title">{title}</h3>
              {subtitle && <p className="ui-modal-subtitle">{subtitle}</p>}
            </div>
          </div>
          <div className="flex-align gap-2">
            {headerActions}
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close">&times;</button>
          </div>
        </div>
        <div className={`modal-body${bodyClassName ? ` ${bodyClassName}` : ''}`} style={bodyStyle}>
          {children}
        </div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};
