/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice?: number;
  purchasePrice?: number;
  discountRate?: number;
  sku: string;
  stock: number;
  categories: mongoose.Types.ObjectId[];
  tags: string[];
  images: string[];
  attributes: {
    key: string;
    value: string;
  }[];
  variants?: {
    _id?: any;
    color?: string;
    size?: string;
    price: number;
    salePrice?: number;
    purchasePrice?: number;
    discountRate?: number;
    stock: number;
    sku?: string;
    image?: string;
    images?: string[];
  }[];
  isFeatured: boolean;
  isNewArrival: boolean;
  isFlashSale: boolean;
  isPublished: boolean;
  ratings: number;
  numReviews: number;
  views: number;
  totalSales: number;
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema<IProduct> = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    price: { 
      type: Number, 
      min: [0, 'Price cannot be negative'] 
    },
    salePrice: { 
      type: Number,
      min: [0, 'Sale price cannot be negative'],
    },
    purchasePrice: { 
      type: Number,
      min: [0, 'Purchase price cannot be negative'],
    },
    discountRate: { type: Number },
    sku: { 
      type: String, 
      unique: true,
      sparse: true
    },
    stock: { type: Number, required: true, default: 0, min: [0, 'Stock cannot be negative'] },
    categories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    tags: [{ type: String }],
    images: [{ type: String }],
    attributes: [
      {
        key: { type: String },
        value: { type: String },
      },
    ],
    variants: [
      {
        color: { type: String },
        size: { type: String },
        price: { type: Number, required: true, min: [0, 'Price cannot be negative'] },
        salePrice: { type: Number, min: [0, 'Sale price cannot be negative'] },
        purchasePrice: { type: Number, min: [0, 'Purchase price cannot be negative'] },
        discountRate: { type: Number },
        stock: { type: Number, required: true, default: 0, min: [0, 'Stock cannot be negative'] },
        sku: { type: String },
        image: { type: String },
        images: [{ type: String }],
      },
    ],
    isFeatured: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isFlashSale: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
    ratings: { type: Number, default: 0, min: [0, 'Rating cannot be below 0'], max: [5, 'Rating cannot be above 5'] },
    numReviews: { type: Number, default: 0, min: [0, 'Number of reviews cannot be negative'] },
    views: { type: Number, default: 0, min: [0, 'Views cannot be negative'] },
    totalSales: { type: Number, default: 0, min: [0, 'Total sales cannot be negative'] },
    embedding: { type: [Number] },
  },
  { timestamps: true }
);

ProductSchema.index({ name: 1 }); // Optimized for search
ProductSchema.index({ categories: 1 }); // Optimized for category filtering

ProductSchema.pre('validate', function(this: any) {
  // Main product validation
  if (this.salePrice !== undefined && this.salePrice !== null && this.salePrice > this.price) {
    throw new Error(
      `Sale price ($${this.salePrice}) should be lower than or equal to regular price ($${this.price})`
    );
  }

  // Variants validation
  if (this.variants && Array.isArray(this.variants)) {
    this.variants.forEach((v: any, index: number) => {
      if (
        v.salePrice !== undefined &&
        v.salePrice !== null &&
        typeof v.price === 'number' &&
        v.salePrice > v.price
      ) {
        const variantDesc = [v.color, v.size].filter(Boolean).join(' / ') || `at index ${index}`;
        throw new Error(
          `Variant "${variantDesc}" has a sale price ($${v.salePrice}) higher than its regular price ($${v.price})`
        );
      }
    });
  }
});

if (mongoose.models && mongoose.models.Product) {
  delete (mongoose.models as any).Product;
}

const Product: Model<IProduct> = mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
