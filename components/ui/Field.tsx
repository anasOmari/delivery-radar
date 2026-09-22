'use client';

import React from 'react';

interface FieldProps {
  label?: React.ReactNode;
  icon?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  htmlFor?: string;
  children: React.ReactNode;
}

/** Single labeled field wrapper (label + control + hint/error). */
export const Field: React.FC<FieldProps> = ({ label, icon, hint, error, htmlFor, children }) => {
  return (
    <div className="ui-field">
      {label && (
        <label className="ui-field-label" htmlFor={htmlFor}>
          {icon}
          <span>{label}</span>
        </label>
      )}
      {children}
      {error ? <span className="ui-field-error">{error}</span> : hint ? <span className="ui-field-hint">{hint}</span> : null}
    </div>
  );
};

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/** Single text input — styled with the global .input-field class. */
export const TextInput = React.forwardRef<HTMLInputElement, InputProps>(function TextInput({ className, ...rest }, ref) {
  return <input ref={ref} className={className ? `input-field ${className}` : 'input-field'} {...rest} />;
});

type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

/** Single textarea — styled with the global .modal-textarea class. */
export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea({ className, ...rest }, ref) {
  return <textarea ref={ref} className={className ? `modal-textarea ${className}` : 'modal-textarea'} {...rest} />;
});
