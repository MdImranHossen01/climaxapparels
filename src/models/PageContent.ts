import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPageSection {
  title?: string;
  content: string;
  image?: string;
}

export interface IPageContent extends Document {
  pageName: string; // e.g., 'About Us', 'Terms & Conditions'
  slug: string;
  sections: IPageSection[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PageContentSchema: Schema<IPageContent> = new Schema(
  {
    pageName: { type: String, required: true },
    slug: { type: String, required: true },
    sections: [
      {
        title: { type: String },
        content: { type: String, required: true },
        image: { type: String },
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Ensure slug is unique
PageContentSchema.index({ slug: 1 }, { unique: true });

const PageContent: Model<IPageContent> =
  mongoose.models.PageContent || mongoose.model<IPageContent>('PageContent', PageContentSchema);

export default PageContent;

