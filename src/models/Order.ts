import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
  purchasePrice?: number;
  image?: string;
  color?: string;
  size?: string;
}

export interface IOrder extends Document {
  user?: mongoose.Types.ObjectId;
  items: IOrderItem[];
  shortId: string;
  totalAmount: number;
  deliveryCharge: number;
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    division?: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: string;
  paymentStatus: 'Pending' | 'Paid' | 'Failed';
  status: 'Order Placed' | 'Confirmed' | 'Paid' | 'Ready for Delivery' | 'Released for Delivery' | 'Cancelled' | 'Delivered';
  transactionId?: string;
  walletAmountUsed?: number;
  earnedRewardAmount?: number;
  couponCode?: string;
  couponDiscountAmount?: number;
  isRewarded?: boolean;
  shippingDetails?: {
    courierName?: string;
    trackingId?: string;
    consignmentId?: string;
    trackingUrl?: string;
    courierStatus?: string;
  };
  isSalesCounted?: boolean;
  manualPaymentDetails?: {
    methodName?: string;
    senderNumber?: string;
    transactionId?: string;
  };
  internalNote?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const OrderSchema: Schema<IOrder> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    shortId: { type: String, unique: true, sparse: true, index: true },
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: [1, 'Quantity must be at least 1'] },
        price: { type: Number, required: true, min: [0.01, 'Price must be at least 0.01'] },
        purchasePrice: { type: Number, min: [0, 'Purchase price cannot be negative'] },
        image: { type: String },
        color: { type: String },
        size: { type: String },
      },
    ],
    totalAmount: { type: Number, required: true, min: [0, 'Total amount cannot be negative'] },
    deliveryCharge: { type: Number, required: true, default: 0, min: [0, 'Delivery charge cannot be negative'] },
    shippingAddress: {
      type: {
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        division: { type: String, required: false },
        zipCode: { type: String, required: true },
        country: { type: String, required: true },
      },
      required: [true, 'Shipping address is required'],
    },
    paymentMethod: { type: String, required: true },
    paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending' },
    status: {
      type: String,
      enum: ['Order Placed', 'Confirmed', 'Paid', 'Ready for Delivery', 'Released for Delivery', 'Cancelled', 'Delivered'],
      default: 'Order Placed',
    },
    transactionId: { type: String },
    walletAmountUsed: { type: Number, default: 0, min: 0 },
    earnedRewardAmount: { type: Number, default: 0, min: 0 },
    couponCode: { type: String },
    couponDiscountAmount: { type: Number, default: 0, min: 0 },
    isRewarded: { type: Boolean, default: false },
    shippingDetails: {
      courierName: { type: String },
      trackingId: { type: String },
      consignmentId: { type: String },
      trackingUrl: { type: String },
      courierStatus: { type: String },
    },
    isSalesCounted: { type: Boolean, default: false },
    manualPaymentDetails: {
      methodName: { type: String },
      senderNumber: { type: String },
      transactionId: { type: String },
    },
    internalNote: { type: String, default: '' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
