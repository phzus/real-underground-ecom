import type { HttpTypes } from "@medusajs/types";

export type MedusaProduct = HttpTypes.StoreProduct;
export type MedusaProductVariant = HttpTypes.StoreProductVariant;
export type MedusaCart = HttpTypes.StoreCart;
export type MedusaCartLineItem = HttpTypes.StoreCartLineItem;
export type MedusaProductCategory = HttpTypes.StoreProductCategory;
export type MedusaRegion = HttpTypes.StoreRegion;

export interface CartContextType {
  cart: MedusaCart | null;
  loading: boolean;
  totalItems: number;
  addItem: (variantId: string, quantity?: number) => Promise<MedusaCart | undefined>;
  updateItem: (lineItemId: string, quantity: number) => Promise<MedusaCart | undefined>;
  removeItem: (lineItemId: string) => Promise<void>;
  updateCart: (data: HttpTypes.StoreUpdateCart) => Promise<MedusaCart | undefined>;
  completeCart: () => Promise<HttpTypes.StoreCompleteCartResponse | undefined>;
  refreshCart: () => Promise<void>;
}
