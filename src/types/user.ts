export interface AddressRequestDTO {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pinCode: string;
  isDefault?: boolean;
}

export interface AddressResponseDTO {
  id: number;
  userId: number;
  name: string;
  email: string;
  mobile: string;
  role: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pinCode: string;
  isDefault: boolean;
}
