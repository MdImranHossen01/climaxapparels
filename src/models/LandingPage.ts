import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ILandingPage extends Document {
  title: string;
  slug: string;
  description?: string;
  sections: {
    id: string; // Unique ID for Drag & Drop
    type: string; // hero, product, features, testimonials, faq, video, order_form, etc.
    content: any; // Flexible object based on section type
    styles?: {
      backgroundColor?: string;
      textColor?: string;
      paddingTop?: string;
      paddingBottom?: string;
    };
  }[];
  seoConfig?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: string;
  };
  isActive: boolean;
  viewCount: number;
  orderCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const LandingPageSchema: Schema<ILandingPage> = new Schema(
  {
    title: { type: String, required: true },
    slug: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true
    },
    description: { type: String },
    sections: [
      {
        id: { type: String, required: true },
        type: { type: String, required: true },
        content: { type: Schema.Types.Mixed, default: {} },
        styles: {
          backgroundColor: { type: String },
          textColor: { type: String },
          paddingTop: { type: String, default: 'py-12' },
          paddingBottom: { type: String, default: 'py-12' },
        },
      },
    ],
    seoConfig: {
      metaTitle: { type: String },
      metaDescription: { type: String },
      ogImage: { type: String },
    },
    isActive: { type: Boolean, default: true },
    viewCount: { type: Number, default: 0 },
    orderCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);


const LandingPage: Model<ILandingPage> =
  mongoose.models.LandingPage || mongoose.model<ILandingPage>('LandingPage', LandingPageSchema);

export default LandingPage;
