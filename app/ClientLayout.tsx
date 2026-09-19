'use client';

import React from 'react';
import { LanguageProvider } from '@/lib/LanguageContext';
import { AuthProvider } from '@/lib/AuthContext';
import { BrandingProvider } from '@/lib/BrandingContext';

export const ClientLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <LanguageProvider>
      <BrandingProvider>
        <AuthProvider>{children}</AuthProvider>
      </BrandingProvider>
    </LanguageProvider>
  );
};
