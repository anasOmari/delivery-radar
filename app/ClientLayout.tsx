'use client';

import React from 'react';
import { LanguageProvider } from '@/lib/LanguageContext';

export const ClientLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <LanguageProvider>{children}</LanguageProvider>;
};
