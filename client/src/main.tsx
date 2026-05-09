/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { queryClient } from './lib/query-client';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import App from './App';
import './index.css';

// Apply saved theme before first paint to prevent flash
const savedTheme = (() => {
  try {
    const stored = JSON.parse(localStorage.getItem('blurz-ui') || '{}');
    return stored?.state?.theme || 'dark';
  } catch {
    return 'dark';
  }
})();
document.documentElement.setAttribute('data-theme', savedTheme);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--color-bg-card)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border-strong)',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: 'var(--color-text-primary)' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: 'var(--color-text-primary)' },
            },
          }}
        />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
