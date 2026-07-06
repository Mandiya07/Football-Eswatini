
export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  imageUrl?: string;
  category: string;
  sizes?: string[];
  colors?: string[];
  stock?: number;
  salePrice?: number;
  purchaseUrl?: string;
}

export const products: Product[] = [];
