export interface InventoryResponseDto {
  productId: number;
  availableQuantity: number;
  reservedQuantity: number;
  lastUpdated: string;
}

export interface StockMutationRequest {
  productId: number;
  quantity: number;
}
