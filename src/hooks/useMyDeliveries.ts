import { useQueries } from '@tanstack/react-query';
import { usePagedQuery } from '@/hooks/usePagedQuery';
import { deliveryApi } from '@/api/deliveryApi';
import { orderApi } from '@/api/orderApi';
import type { DeliveryResponseDto } from '@/types/delivery';
import type { OrderResponseDto } from '@/types/order';

export interface DeliveryWithOrder {
  delivery: DeliveryResponseDto;
  order: OrderResponseDto | undefined;
  orderLoading: boolean;
  orderError: boolean;
}

/**
 * GET /restful/v1/api/delivery/my only returns the delivery record itself (orderId,
 * vendorId, status, ...) — it doesn't carry the customer/items/amount info the delivery
 * team actually needs (OrderDetailPage.tsx does the same join the other direction: order ->
 * deliveries). GET /orders/{orderId} has no role restriction server-side, so we hydrate each
 * delivery with its order in parallel.
 */
export function useMyDeliveries(page: number, size: number) {
  const deliveries = usePagedQuery<DeliveryResponseDto>(
    ['my-deliveries'],
    (p, s) => deliveryApi.getMy(p, s),
    page,
    size
  );

  const orderQueries = useQueries({
    queries: deliveries.items.map((d) => ({
      queryKey: ['order', d.orderId],
      queryFn: () => orderApi.getById(d.orderId),
      staleTime: 30_000,
    })),
  });

  const rows: DeliveryWithOrder[] = deliveries.items.map((delivery, i) => ({
    delivery,
    order: orderQueries[i]?.data,
    orderLoading: orderQueries[i]?.isLoading ?? false,
    orderError: orderQueries[i]?.isError ?? false,
  }));

  return { ...deliveries, rows };
}
