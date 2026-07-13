const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Read .env.local file to get MONGODB_URI
const envPath = path.join(__dirname, '../.env.local');
let mongodbUri = process.env.MONGODB_URI || '';

if (!mongodbUri && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/^MONGODB_URI=(.*)$/m);
  if (match && match[1]) {
    mongodbUri = match[1].trim().replace(/['"]/g, '');
  }
}

console.log('Connecting to MongoDB...');

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true },
    image: { type: String },
    parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);

const categories = [
  {
    name: 'Bags',
    slug: 'bags',
    image: '/assets/images/cagetory/handbag.b457671e.webp',
    isActive: true,
  },
  {
    name: 'Shoes',
    slug: 'shoes',
    image: '/assets/images/cagetory/shoes.de4e3d85.webp',
    isActive: true,
  },
  {
    name: 'Jewelry',
    slug: 'jewelry',
    image: '/assets/images/cagetory/necklace.374b9804.webp',
    isActive: true,
  },
  {
    name: 'Beauty Products',
    slug: 'beauty-products',
    image: '/assets/images/cagetory/beauty_product.d111272d.webp',
    isActive: true,
  },
  {
    name: 'Mens Clothing',
    slug: 'mens-clothing',
    image: '/assets/images/cagetory/mens_clothing.350a3497.webp',
    isActive: true,
  },
  {
    name: 'Womens Clothing',
    slug: 'womens-clothing',
    image: '/assets/images/cagetory/clothing.9917b6ae.webp',
    isActive: true,
  },
  {
    name: 'Baby Items',
    slug: 'baby-items',
    image: '/assets/images/cagetory/child-shoe.213d9bc4.webp',
    isActive: true,
  },
  {
    name: 'Sunglass',
    slug: 'sunglass',
    image: '/assets/images/cagetory/sunglass.f5333693.webp',
    isActive: true,
  },
  {
    name: 'Phone Accessories',
    slug: 'phone-accessories',
    image: '/assets/images/cagetory/mobile.33aae6fe.webp',
    isActive: true,
  },
  {
    name: 'Sports & Fitness',
    slug: 'sports-fitness',
    image: '/assets/images/cagetory/sport.9e051f78.webp',
    isActive: true,
  },
  {
    name: 'Watches',
    slug: 'watches',
    image: '/assets/images/cagetory/watch.9755a6ec.webp',
    isActive: true,
  },
  {
    name: 'Food Items',
    slug: 'food-items',
    image: '/assets/images/cagetory/grocery.2792c849.webp',
    isActive: true,
  },
  {
    name: 'Traveling',
    slug: 'traveling',
    image: '/assets/images/cagetory/travel.04b6513f.webp',
    isActive: true,
  },
  {
    name: 'Gadgets',
    slug: 'gadgets',
    image: '/assets/images/cagetory/gadget.2b0fcbdc.webp',
    isActive: true,
  }
];

async function seed() {
  try {
    await mongoose.connect(mongodbUri);
    console.log('Connected to MongoDB successfully.');

    // Clear existing categories
    const deleteResult = await Category.deleteMany({});
    console.log(`Cleared ${deleteResult.deletedCount} existing categories.`);

    // Insert new categories
    const insertResult = await Category.insertMany(categories);
    console.log(`Seeded ${insertResult.length} categories successfully:`);
    insertResult.forEach((c, i) => {
      console.log(`[Category ${i + 1}] Name: "${c.name}", Slug: "${c.slug}", Image: "${c.image}"`);
    });

  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

seed();
