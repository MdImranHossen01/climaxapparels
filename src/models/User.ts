import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'super_admin' | 'admin' | 'user';
  image?: string;
  phone?: string;
  lastActive?: Date;
  googleId?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  isSubscriptionActive: boolean;
  walletBalance: number;
  addresses: {
    street?: string;
    division?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    isDefault?: boolean;
  }[];
  wishlist: mongoose.Types.ObjectId[];
  cart: {
    productId: mongoose.Types.ObjectId;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    color?: string;
    size?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.[A-Za-z]{2,})+$/, 'Please provide a valid email address']
    },
    password: { type: String, select: false },
    role: { type: String, enum: ['super_admin', 'admin', 'user'], default: 'user' },
    image: { type: String },
    phone: { type: String },
    googleId: { type: String },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date },
    lastActive: { type: Date, default: Date.now },
    isSubscriptionActive: { type: Boolean, default: false },
    walletBalance: { type: Number, default: 0, min: 0 },
    addresses: [
      {
        street: { type: String },
        division: { type: String },
        city: { type: String },
        state: { type: String },
        zipCode: { type: String },
        country: { type: String },
        isDefault: { type: Boolean, default: false },
      },
    ],
    wishlist: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    cart: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        image: { type: String },
        color: { type: String },
        size: { type: String },
      }
    ],
  },
  { timestamps: true }
);

UserSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;

