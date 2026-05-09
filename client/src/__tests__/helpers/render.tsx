/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, type MemoryRouterProps } from 'react-router';

// Fresh QueryClient for each test to prevent cache leaks
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface WrapperOptions {
  routerProps?: MemoryRouterProps;
  queryClient?: QueryClient;
}

/**
 * Custom render that wraps components with providers needed for the app:
 * - QueryClientProvider (React Query)
 * - MemoryRouter (react-router)
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: RenderOptions & WrapperOptions,
) {
  const { routerProps, queryClient, ...renderOptions } = options ?? {};
  const client = queryClient ?? createTestQueryClient();

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <MemoryRouter {...routerProps}>
          {children}
        </MemoryRouter>
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient: client,
  };
}

export { createTestQueryClient };
