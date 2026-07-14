import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICatalogItem {
  name: string;
  image: string;
}

export interface ICatalogCategory {
  id: string;
  name: string;
  description: string;
  items: ICatalogItem[];
}

export interface ICatalogCompanyInfo {
  about: string;
  capacity: string;
  established: string;
  certifications: string;
  markets: string;
  address: string;
  phone: string;
  email: string;
  corporatePresence: string;
}

export interface ICatalog extends Document {
  companyInfo: ICatalogCompanyInfo;
  categories: ICatalogCategory[];
  updatedAt: Date;
}

const CatalogItemSchema = new Schema<ICatalogItem>({
  name: { type: String, required: true },
  image: { type: String, default: '' },
});

const CatalogCategorySchema = new Schema<ICatalogCategory>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  items: [CatalogItemSchema],
});

const CatalogSchema = new Schema<ICatalog>(
  {
    companyInfo: {
      about: { type: String, default: '' },
      capacity: { type: String, default: '5,00,000 pcs/m' },
      established: { type: String, default: 'Since 2014' },
      certifications: { type: String, default: 'ISO, BSCI Certified' },
      markets: { type: String, default: 'EU, USA, Mid-East' },
      address: { type: String, default: 'Sarkarbari, Helal Market, Uttar Khan, Dhaka, Bangladesh' },
      phone: { type: String, default: '+880 1724-338581' },
      email: { type: String, default: 'info@climaxapparels.com' },
      corporatePresence: { type: String, default: 'LinkedIn / Alibaba / Google Business Profile' },
    },
    categories: [CatalogCategorySchema],
  },
  { timestamps: true }
);

const Catalog: Model<ICatalog> =
  mongoose.models.Catalog || mongoose.model<ICatalog>('Catalog', CatalogSchema);

export default Catalog;
