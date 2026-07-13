import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAbandonedCartItem {
  product: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  color?: string;
  size?: string;
}

export interface IAbandonedCart extends Document {
  user?: mongoose.Types.ObjectId;
  fullName: string;
  phone: string;
  email?: string;
  street?: string;
  deliveryArea?: string;
  items: IAbandonedCartItem[];
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const AbandonedCartSchema: Schema<IAbandonedCart> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, index: true, trim: true },
    email: { type: String, trim: true },
    street: { type: String, trim: true },
    deliveryArea: { type: String, trim: true },
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true },
        image: { type: String },
        color: { type: String },
        size: { type: String },
      }
    ],
    totalAmount: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

const AbandonedCart: Model<IAbandonedCart> =
  mongoose.models.AbandonedCart || mongoose.model<IAbandonedCart>('AbandonedCart', AbandonedCartSchema);

export default AbandonedCart;
