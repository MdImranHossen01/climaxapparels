export type Product = ({ id: string; _id?: string } | { _id: string; id?: string }) & {
  name: string;
  slug?: string;
  price: number;
  salePrice?: number;
  images: string[];
  description?: string;
  stockQuantity?: number;
  inStock?: boolean;
  ratings?: number;
  numReviews?: number;
  isNew?: boolean;
  isFeatured?: boolean;
  categories?: { name: string }[];
  specifications?: {
    performance?: string;
    connectivity?: string;
    [key: string]: any;
  };
}

