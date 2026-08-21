import type { QueryClient } from '@tanstack/react-query';

/** Immediately refetch lists after admin publishes announcements or events. */
export async function refreshPublishedContent(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.refetchQueries({ queryKey: ['announcements'] }),
    queryClient.refetchQueries({ queryKey: ['events'] }),
  ]);
}
