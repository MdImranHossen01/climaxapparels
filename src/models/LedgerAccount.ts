import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ILedgerAccount extends Document {
  name: string;
  code: 'CASH' | 'BANK' | 'AR' | 'AP';
  openingBalance: number;
  currentBalance: number;
  type: 'asset' | 'liability';
  createdAt: Date;
  updatedAt: Date;
}

const LedgerAccountSchema: Schema<ILedgerAccount> = new Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, enum: ['CASH', 'BANK', 'AR', 'AP'] },
    openingBalance: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },
    type: { type: String, default: 'asset', enum: ['asset', 'liability'] },
  },
  { timestamps: true }
);

const LedgerAccount: Model<ILedgerAccount> =
  mongoose.models.LedgerAccount || mongoose.model<ILedgerAccount>('LedgerAccount', LedgerAccountSchema);

export default LedgerAccount;
