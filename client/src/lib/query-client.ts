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
