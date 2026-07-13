import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISlider extends Document {
  title: string;
  subtitle?: string;
  image: string;
  ctaText?: string;
  ctaLink?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SliderSchema: Schema<ISlider> = new Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    image: { type: String, required: true },
    ctaText: { type: String },
    ctaLink: { type: String },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Slider: Model<ISlider> = mongoose.models.Slider || mongoose.model<ISlider>('Slider', SliderSchema);

export default Slider;

