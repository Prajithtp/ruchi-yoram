export type ProductWeight = 200 | 400 | 600 | 1000;

export interface ProductVariant {
  readonly weight: ProductWeight;
  readonly pricePaise: number;
}

export interface Product {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly image: string;
  readonly vegetarian: boolean;
  readonly variants: readonly ProductVariant[];
  readonly isCombo?: boolean;
  readonly ingredients?: string;
  readonly allergenInfo?: string;
  readonly regularPricePaise?: number;
  readonly storageInstructions?: string;
  readonly shelfLife?: string;
}

export interface CartItem {
  readonly key: string;
  readonly product: Product;
  readonly weight: ProductWeight;
  readonly unitPricePaise: number;
  readonly quantity: number;
}