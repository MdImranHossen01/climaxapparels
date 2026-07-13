import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IWalletTransaction extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  type: 'earned' | 'spent' | 'refund' | 'admin_adjustment';
  status: 'pending' | 'completed' | 'failed';
  orderId?: mongoose.Types.ObjectId;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const WalletTransactionSchema: Schema<IWalletTransaction> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    type: { 
      type: String, 
      enum: ['earned', 'spent', 'refund', 'admin_adjustment'], 
      required: true 
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed'
    },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    description: { type: String, required: true },
  },
  { timestamps: true }
);

// Indexes for performance
WalletTransactionSchema.index({ userId: 1, createdAt: -1 });
WalletTransactionSchema.index({ orderId: 1 });

const WalletTransaction: Model<IWalletTransaction> =
  mongoose.models.WalletTransaction || mongoose.model<IWalletTransaction>('WalletTransaction', WalletTransactionSchema);

export default WalletTransaction;

