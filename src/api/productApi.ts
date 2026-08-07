import { apiClient } from '@/api/client';
import { buildMultipart } from '@/utils/formData';
import type {
  BannerRequestDto,
  BannerResponseDto,
  ProductCategory,
  ProductRequestDto,
  ProductResponseDto,
  WishlistRequestDto,
} from '@/types/product';

const BASE = '/restful/v1/api/products';
const BANNER_BASE = '/restful/v1/api/banner';

export const productApi = {
  getAll: (page: number, size: number) =>
    apiClient.get<ProductResponseDto[]>(`${BASE}/getAll`, { params: { page, size } }).then((r) => r.data),

  search: (keyword: string, page: number, size: number) =>
    apiClient.get<ProductResponseDto[]>(`${BASE}/search`, { params: { keyword, page, size } }).then((r) => r.data),

  getByCategory: (category: ProductCategory, page: number, size: number) =>
    apiClient
      .get<ProductResponseDto[]>(`${BASE}/category/${category}`, { params: { page, size } })
      .then((r) => r.data),

  getById: (id: number) => apiClient.get<ProductResponseDto>(`${BASE}/${id}`).then((r) => r.data),

  getCategories: () => apiClient.get<ProductCategory[]>(`${BASE}/categories`).then((r) => r.data),

  getByVendor: (vendorId: number, page: number, size: number) =>
    apiClient
      .get<ProductResponseDto[]>(`${BASE}/vendor/${vendorId}`, { params: { page, size } })
      .then((r) => r.data),

  create: (dto: ProductRequestDto, image: File) =>
    apiClient
      .post<ProductResponseDto>(`${BASE}/create`, buildMultipart(dto, image))
      .then((r) => r.data),

  update: (id: number, dto: ProductRequestDto, image?: File | null) =>
    apiClient
      .put<ProductResponseDto>(`${BASE}/${id}`, buildMultipart(dto, image))
      .then((r) => r.data),

  remove: (id: number) => apiClient.delete<void>(`${BASE}/${id}`).then((r) => r.data),

  updateWishlist: (id: number, dto: WishlistRequestDto) =>
    apiClient.put<ProductResponseDto>(`${BASE}/${id}/wishlist`, dto).then((r) => r.data),
};

export const bannerApi = {
  getAllPublic: () => apiClient.get<BannerResponseDto[]>(`${BANNER_BASE}/getAll`).then((r) => r.data),

  getAllAdmin: () => apiClient.get<BannerResponseDto[]>(`${BANNER_BASE}/all`).then((r) => r.data),

  create: (dto: BannerRequestDto, image: File) =>
    apiClient.post<BannerResponseDto>(`${BANNER_BASE}/create`, buildMultipart(dto, image)).then((r) => r.data),

  update: (id: number, dto: BannerRequestDto, image?: File | null) =>
    apiClient.put<BannerResponseDto>(`${BANNER_BASE}/${id}`, buildMultipart(dto, image)).then((r) => r.data),

  remove: (id: number) => apiClient.delete<void>(`${BANNER_BASE}/${id}`).then((r) => r.data),

  toggle: (id: number) => apiClient.put<BannerResponseDto>(`${BANNER_BASE}/${id}/toggle`).then((r) => r.data),
};
