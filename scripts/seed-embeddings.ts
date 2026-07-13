import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { GoogleGenAI } from '@google/genai';

// Load env variables to get MONGODB_URI
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('.env.local file not found');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
let mongoUri = '';

envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts[0]) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    if (key === 'MONGODB_URI') mongoUri = val;
  }
});

if (!mongoUri) {
  console.error('MONGODB_URI not found in .env.local');
  process.exit(1);
}

// Minimal schemas for seeding
const GlobalSettingsSchema = new mongoose.Schema({
  aiConfig: {
    geminiApiKey: String
  }
}, { collection: 'globalsettings' });

const ProductSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  salePrice: Number,
  sku: String,
  stock: Number,
  slug: String,
  isPublished: { type: Boolean, default: true },
  embedding: [Number]
});

const BlogSchema = new mongoose.Schema({
  title: String,
  metaDescription: String,
  content: String,
  slug: String,
  isPublished: { type: Boolean, default: true },
  embedding: [Number]
});

const FAQSchema = new mongoose.Schema({
  question: String,
  answer: String,
  isActive: { type: Boolean, default: true },
  embedding: [Number]
});

const GlobalSettings = mongoose.models.GlobalSettings || mongoose.model('GlobalSettings', GlobalSettingsSchema);
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
const Blog = mongoose.models.Blog || mongoose.model('Blog', BlogSchema);
const FAQ = mongoose.models.FAQ || mongoose.model('FAQ', FAQSchema);

// Helper to generate embedding
async function getEmbedding(text: string, aiClient: GoogleGenAI): Promise<number[]> {
  try {
    const cleanText = text.replace(/\n/g, ' ').trim();
    const response = await aiClient.models.embedContent({
      model: 'gemini-embedding-2',
      contents: cleanText,
      config: {
        outputDimensionality: 768,
      },
    });
    if (response.embeddings && response.embeddings[0] && response.embeddings[0].values) {
      return response.embeddings[0].values;
    }
    throw new Error('No embedding values returned');
  } catch (error) {
    console.error(`Error embedding text: "${text.substring(0, 40)}..."`, error);
    throw error;
  }
}

async function seedEmbeddings() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // 1. Fetch API Key from GlobalSettings in database
    const settings = await GlobalSettings.findOne().lean().exec() as any;
    const apiKey = settings?.aiConfig?.geminiApiKey;

    if (!apiKey) {
      console.error('❌ Gemini API Key not found in Database settings (GlobalSettings). Please configure it via Admin Panel first.');
      process.exit(1);
    }

    const singleKey = apiKey.split(',')[0].trim();
    const aiClient = new GoogleGenAI({ apiKey: singleKey });
    console.log('Successfully initialized Gemini client using database API key.');

    // 2. Embed Products
    const products = await Product.find({ embedding: { $exists: false }, isPublished: { $ne: false } });
    console.log(`Found ${products.length} products to embed.`);
    for (const product of products) {
      const text = `Product: ${product.name}. Price: ${product.price} BDT. Sale Price: ${product.salePrice || 'N/A'} BDT. SKU: ${product.sku || ''}. Description: ${product.description || ''}`;
      console.log(`Embedding Product: ${product.name}`);
      product.embedding = await getEmbedding(text, aiClient);
      await product.save();
    }

    // 3. Embed Blogs
    const blogs = await Blog.find({ embedding: { $exists: false }, isPublished: { $ne: false } });
    console.log(`Found ${blogs.length} blogs to embed.`);
    for (const blog of blogs) {
      const text = `Blog: ${blog.title}. Description: ${blog.metaDescription || ''}. Content Summary: ${(blog.content || '').substring(0, 300)}`;
      console.log(`Embedding Blog: ${blog.title}`);
      blog.embedding = await getEmbedding(text, aiClient);
      await blog.save();
    }

    // 4. Embed FAQs
    const faqs = await FAQ.find({ embedding: { $exists: false }, isActive: { $ne: false } });
    console.log(`Found ${faqs.length} FAQs to embed.`);
    for (const faq of faqs) {
      const text = `FAQ Question: ${faq.question}\nAnswer: ${faq.answer}`;
      console.log(`Embedding FAQ: ${faq.question}`);
      faq.embedding = await getEmbedding(text, aiClient);
      await faq.save();
    }

    console.log('✅ Embedding seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding embeddings:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedEmbeddings();
