import { useQuery, keepPreviousData } from '@tanstack/react-query';

/**
 * Every list endpoint in zivdah-api returns a bare array (no Page wrapper, no
 * totalElements). To still drive an antd <Table> pagination control without
 * fabricating a count the backend doesn't provide, we ask for `size + 1` items:
 * if we get back more than `size`, we know there's at least one more page.
 */
export function usePagedQuery<T>(
  queryKey: unknown[],
  fetchPage: (page: number, sizePlusOne: number) => Promise<T[]>,
  page: number,
  size: number,
  enabled = true
) {
  const query = useQuery({
    queryKey: [...queryKey, page, size],
    queryFn: () => fetchPage(page, size + 1),
    placeholderData: keepPreviousData,
    enabled,
  });

  const raw = query.data ?? [];
  const hasNextPage = raw.length > size;
  const items = hasNextPage ? raw.slice(0, size) : raw;
  const total = hasNextPage ? (page + 1) * size + 1 : page * size + items.length;

  return { ...query, items, hasNextPage, total };
}
