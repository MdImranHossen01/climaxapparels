const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Read .env.local file to get MONGODB_URI
const envPath = path.join(__dirname, '../.env.local');
let mongodbUri = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/^MONGODB_URI=(.*)$/m);
  if (match && match[1]) {
    mongodbUri = match[1].trim().replace(/['"]/g, '');
  }
}

if (!mongodbUri) {
  mongodbUri = 'mongodb+srv://Climax Apparels:xI2QuBaFZsYQ5vRD@cluster0.e5n1hnl.mongodb.net/Climax Apparels';
}

console.log('Connecting to MongoDB...');

const FAQSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const FAQ = mongoose.models.FAQ || mongoose.model('FAQ', FAQSchema);

const faqs = [
  {
    question: 'What type of products does Climax Apparels offer?',
    answer: 'Climax Apparels offers premium and comfortable menswear. Our collection includes high-quality T-shirts, Polo Shirts, Casual & Formal Shirts, Hoodies, and comfortable Pants.',
    order: 1,
    isActive: true,
  },
  {
    question: 'How is the fabric quality of your clothing?',
    answer: 'We use premium combed cotton, high-GSM pique knit, and top-grade woven fabrics for our products. Our fabrics are pre-shrunk, meaning they will not lose their shape or fade after washing.',
    order: 2,
    isActive: true,
  },
  {
    question: 'What are the shipping charges and delivery times?',
    answer: 'Delivery within Dhaka takes 24 to 48 hours with a shipping fee of 60 BDT. For locations outside Dhaka, shipping is 120 BDT and delivery takes 3 to 5 business days.',
    order: 3,
    isActive: true,
  },
  {
    question: 'Can I exchange a product if the size does not fit?',
    answer: 'Yes! We offer a hassle-free 7-day exchange policy. If you have size issues, you can exchange the item as long as it is unused, unwashed, and has its original tags attached.',
    order: 4,
    isActive: true,
  },
  {
    question: 'How do I choose the correct size?',
    answer: 'We provide a detailed Size Chart on every product page. We highly recommend measuring your chest and length before placing an order to find your perfect fit.',
    order: 5,
    isActive: true,
  }
];

async function seed() {
  try {
    try {
      await mongoose.connect(mongodbUri);
    } catch (connErr) {
      console.log('SRV connection failed, trying direct connection fallback...');
      const directUri = 'mongodb://Climax Apparels:xI2QuBaFZsYQ5vRD@ac-jrowhop-shard-00-00.e5n1hnl.mongodb.net:27017,ac-jrowhop-shard-00-01.e5n1hnl.mongodb.net:27017,ac-jrowhop-shard-00-02.e5n1hnl.mongodb.net:27017/Climax Apparels?ssl=true&authSource=admin';
      await mongoose.connect(directUri);
    }
    console.log('Connected to MongoDB successfully.');

    // Clear existing FAQs
    const deleteResult = await FAQ.deleteMany({});
    console.log(`Cleared ${deleteResult.deletedCount} existing FAQs.`);

    // Insert new FAQs
    const insertResult = await FAQ.insertMany(faqs);
    console.log(`Seeded ${insertResult.length} FAQs successfully:`);
    insertResult.forEach((f, i) => {
      console.log(`[FAQ ${i + 1}] Question: "${f.question}"`);
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
