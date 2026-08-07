export type ProductCategory = 'VEGETABLE' | 'FRUIT' | 'MILK' | 'PULSE' | 'GROCERY';

export interface ProductRequestDto {
  id?: number;
  name: string;
  category: ProductCategory;
  price: number;
  discountPrice?: number;
  unit: string;
  stockQuantity: number;
  expiryDate?: string; // ISO date (yyyy-MM-dd)
  description?: string;
  organic?: boolean;
  fav?: boolean;
  brand?: string;
}

export interface ProductResponseDto {
  id: number;
  name: string;
  category: ProductCategory;
  price: number;
  discountPrice?: number;
  unit: string;
  stockQuantity: number;
  inStock: boolean;
  expiryDate?: string;
  description?: string;
  imageUrl?: string;
  organic?: boolean;
  brand?: string;
  fav?: boolean;
  createdAt: string;
  updatedAt: string;
  // Null = platform-owned (created by ADMIN). Set = owned by that VENDOR userId.
  vendorId: number | null;
}

export interface WishlistRequestDto {
  fav: boolean;
}

export interface BannerRequestDto {
  title?: string;
  active?: boolean;
}

export interface BannerResponseDto {
  id: number;
  imageUrl: string;
  title?: string;
  active: boolean;
}
