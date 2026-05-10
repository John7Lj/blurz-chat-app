/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { QueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { extractErrorMessage } from './axios';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,       // 30 seconds
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        toast.error(extractErrorMessage(error));
      },
    },
  },
});
