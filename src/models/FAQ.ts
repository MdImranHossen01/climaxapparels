import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IFAQ extends Document {
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

const FAQSchema: Schema<IFAQ> = new Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    embedding: { type: [Number] },
  },
  { timestamps: true }
);

// Optimize queries that filter by active status
FAQSchema.index({ isActive: 1 });

const FAQ: Model<IFAQ> = mongoose.models.FAQ || mongoose.model<IFAQ>('FAQ', FAQSchema);

export default FAQ;

