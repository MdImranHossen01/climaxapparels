import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  minPurchase: number;
  expiryDate: Date;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema: Schema<ICoupon> = new Schema(
  {
    code: { 
      type: String, 
      required: true, 
      uppercase: true, 
      trim: true 
    },
    discountType: { 
      type: String, 
      enum: ['fixed', 'percentage'], 
      required: true 
    },
    discountValue: { 
      type: Number, 
      required: true,
      min: 0,
      validate: {
        validator: function(this: any, value: number) {
          if (this.discountType === 'percentage') {
            return value <= 100;
          }
          return true;
        },
        message: 'Percentage discount cannot exceed 100%'
      }
    },
    minPurchase: { type: Number, default: 0 },
    expiryDate: { type: Date, required: true },
    usageLimit: { type: Number },
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Ensure coupon code is unique
CouponSchema.index({ code: 1 }, { unique: true });

const Coupon: Model<ICoupon> = mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);

export default Coupon;

