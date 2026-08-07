export type DiscountType = 'PERCENTAGE' | 'FIXED';

export interface CouponRequestDto {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit: number;
  validFrom: string; // ISO datetime
  validUntil: string; // ISO datetime
}

export interface CouponResponseDto {
  id: number;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit: number;
  usedCount: number;
  active: boolean;
  validFrom: string;
  validUntil: string;
  createdAt: string;
}

export interface ApplyCouponRequest {
  code: string;
  orderAmount: number;
}

export interface ApplyCouponResponseDto {
  couponCode: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  message: string;
}
