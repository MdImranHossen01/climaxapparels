import mongoose, { Schema, Document } from 'mongoose';

export interface IFraudCheck extends Document {
  phone: string;
  data: any;
  createdAt: Date;
  updatedAt: Date;
}

const FraudCheckSchema: Schema = new Schema({
  phone: { type: String, required: true, unique: true, index: true },
  data: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true });

export default mongoose.models.FraudCheck || mongoose.model<IFraudCheck>('FraudCheck', FraudCheckSchema);
