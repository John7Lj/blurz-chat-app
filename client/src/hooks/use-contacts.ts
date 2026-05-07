import { useQuery } from '@tanstack/react-query';
import { useState, useDeferredValue } from 'react';
import { userService } from '../services/user.service';
import type { ContactUser } from '../schemas/user.schema';

export function useContacts() {
  return useQuery<ContactUser[]>({
    queryKey: ['contacts'],
    queryFn: userService.getContacts,
  });
}

export function useSearchUsers() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  const searchResult = useQuery<ContactUser[]>({
    queryKey: ['search-users', deferredQuery],
    queryFn: () => userService.searchUsers(deferredQuery),
    enabled: deferredQuery.length >= 2,
  });

  return { query, setQuery, ...searchResult };
}
