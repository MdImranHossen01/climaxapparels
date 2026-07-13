import connectToDatabase from '@/lib/db';
import { getEmbedding } from '@/lib/embeddings';

// Import Mongoose models
import Product from '@/models/Product';
import Blog from '@/models/Blog';
import FAQ from '@/models/FAQ';
import Order from '@/models/Order';
import Category from '@/models/Category';
import Coupon from '@/models/Coupon';

interface RetrievedDocument {
  source: string;
  title: string;
  text: string;
  url?: string;
  score?: number;
}

/**
 * Searches the MongoDB database semantically using vector similarity and retrieves user context.
 */
export async function retrieveRelevantContext(
  query: string,
  userId?: string,
  apiKey?: string,
  limitPerModel = 3
): Promise<string> {
  try {
    await connectToDatabase();

    let queryVector: number[] | null = null;
    if (apiKey) {
      try {
        queryVector = await getEmbedding(query, apiKey);
      } catch (err) {
        console.error("Error generating query embedding for RAG:", err);
      }
    }

    const retrievalPromises: Promise<RetrievedDocument[]>[] = [];

    // Helper to perform vector search on a model with fallback to text search
    const searchModel = async (
      model: any,
      modelName: string,
      textFormatter: (doc: any) => string,
      urlGenerator: (doc: any) => string
    ): Promise<RetrievedDocument[]> => {
      try {
        if (!queryVector) {
          return [];
        }

        // Run Atlas Vector Search
        // Atlas requires an index named "vector_index" for vector searches
        let results = await model.aggregate([
          {
            $vectorSearch: {
              index: "vector_index",
              path: "embedding",
              queryVector: queryVector,
              numCandidates: 30,
              limit: limitPerModel,
            }
          },
          {
            $match: {
              isPublished: { $ne: false },
              isActive: { $ne: false }
            }
          }
        ]).exec();

        if (!results || results.length === 0) {
          return [];
        }

        return results.map((doc: any) => ({
          source: modelName,
          title: doc.name || doc.title || doc.question || 'Untitled',
          text: textFormatter(doc),
          url: urlGenerator(doc),
          score: doc.$vectorSearchScore,
        }));
      } catch (vectorSearchError) {
        return [];
      }
    };

    // 1. Queue searches for products, blogs, and FAQs
    retrievalPromises.push(
      searchModel(
        Product,
        'Product',
        (doc) => `Product: ${doc.name}. Price: ${doc.price} BDT. Sale Price: ${doc.salePrice || 'N/A'} BDT. SKU: ${doc.sku}. Stock: ${doc.stock}. Description: ${doc.description}`,
        (doc) => `/product/${doc.slug || doc._id}`
      )
    );

    retrievalPromises.push(
      searchModel(
        Blog,
        'Blog',
        (doc) => `Blog: ${doc.title}. Description: ${doc.metaDescription || ''}. Content Summary: ${doc.content.substring(0, 300)}...`,
        (doc) => `/blog/${doc.slug || doc._id}`
      )
    );

    retrievalPromises.push(
      searchModel(
        FAQ,
        'FAQ',
        (doc) => `FAQ Question: ${doc.question}\nAnswer: ${doc.answer}`,
        () => `/faq`
      )
    );

    // Resolve general database matches
    const allResultsGroups = await Promise.all(retrievalPromises);
    const mergedResults = allResultsGroups.flat();

    // 2. Format outputs into a context string for the LLM
    let contextString = "Here is the relevant real-time data from Climax Apparels's database:\n\n";

    // Direct lookup for Order Tracking
    // Match phone numbers or 5+ digit numeric strings (order shortIds)
    const phoneMatch = query.match(/(?:01[3-9]\d{8})|(?:\+8801[3-9]\d{8})/);
    const orderIdMatch = query.match(/\b\d{5,8}\b/);

    let directOrderContext = "";
    if (orderIdMatch && userId) {
      const matchedOrder = await Order.findOne({ shortId: orderIdMatch[0], user: userId }).lean().exec();
      if (matchedOrder) {
        directOrderContext += `Matched Order Details (ID: ${matchedOrder.shortId}):\n`;
        directOrderContext += `- Status: ${matchedOrder.status}\n`;
        directOrderContext += `- Payment Status: ${matchedOrder.paymentStatus}\n`;
        directOrderContext += `- Total Amount: ${matchedOrder.totalAmount} BDT\n`;
        directOrderContext += `- Ordered Items:\n`;
        matchedOrder.items?.forEach((item: any) => {
          directOrderContext += `  * ${item.name} (Qty: ${item.quantity}, Price: ${item.price} BDT)\n`;
        });
        directOrderContext += `\n`;
      }
    }

    if (phoneMatch && userId && !directOrderContext) {
      const phoneNumber = phoneMatch[0];
      const matchedOrders = await Order.find({ "shippingAddress.phone": phoneNumber, user: userId })
        .sort({ createdAt: -1 })
        .limit(2)
        .lean()
        .exec();

      if (matchedOrders && matchedOrders.length > 0) {
        directOrderContext += `Matched Orders by Phone Number (${phoneNumber}):\n`;
        matchedOrders.forEach((order: any) => {
          directOrderContext += `- Order ID: ${order.shortId}\n`;
          directOrderContext += `  * Status: ${order.status} (Payment: ${order.paymentStatus})\n`;
          directOrderContext += `  * Total: ${order.totalAmount} BDT\n`;
        });
        directOrderContext += `\n`;
      }
    }

    if (directOrderContext) {
      contextString += directOrderContext;
    }

    // 3. User's Personal Order Context (if logged in)
    if (userId) {
      const userOrders = await Order.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(3)
        .lean()
        .exec();

      if (userOrders && userOrders.length > 0) {
        contextString += `User's Personal Recent Orders:\n`;
        userOrders.forEach((order: any) => {
          contextString += `- Order ID: ${order.shortId}\n`;
          contextString += `  * Status: ${order.status} (Payment: ${order.paymentStatus})\n`;
          contextString += `  * Total Amount: ${order.totalAmount} BDT\n`;
          contextString += `  * Items: ${order.items?.map((i: any) => i.name).join(', ')}\n`;
        });
        contextString += `\n`;
      } else {
        contextString += `User's Personal Orders:\n- The user does not have any previous orders.\n\n`;
      }
    }

    // 4. Fetch Global Platform Statistics
    const totalProductsCount = await Product.countDocuments({ isPublished: true });
    const totalCategoriesCount = await Category.countDocuments();
    const totalFAQsCount = await FAQ.countDocuments({ isActive: true });

    // 5. Fetch active coupons
    const now = new Date();
    const activeCoupons = await Coupon.find({
      isActive: true,
      expiryDate: { $gt: now },
      $or: [
        { usageLimit: { $exists: false } },
        { usageLimit: null },
        { $expr: { $lt: ['$usedCount', '$usageLimit'] } }
      ]
    }).lean().exec();

    // 6. Fetch discounted products (where salePrice is set and less than price)
    const discountedProducts = await Product.find({
      isPublished: true,
      salePrice: { $exists: true, $gt: 0 }
    }).select('name slug price salePrice').limit(10).lean().exec();

    contextString += `Global Platform Statistics:\n`;
    contextString += `- Total Active Products: ${totalProductsCount}\n`;
    contextString += `- Total Categories: ${totalCategoriesCount}\n`;
    contextString += `- Total FAQs: ${totalFAQsCount}\n\n`;

    // Coupon context
    if (activeCoupons.length > 0) {
      contextString += `Active Coupon Offers (currently valid):\n`;
      activeCoupons.forEach((coupon: any) => {
        const discountText = coupon.discountType === 'percentage'
          ? `${coupon.discountValue}% off`
          : `৳${coupon.discountValue} off`;
        contextString += `- Code: ${coupon.code} | Discount: ${discountText} | Min Purchase: ৳${coupon.minPurchase} | Expires: ${new Date(coupon.expiryDate).toLocaleDateString('en-BD')}\n`;
      });
      contextString += `\n`;
    } else {
      contextString += `Active Coupon Offers: No active coupon offers at the moment.\n\n`;
    }

    // Discounted products context
    if (discountedProducts.length > 0) {
      contextString += `Products Currently on Sale/Discount:\n`;
      discountedProducts.forEach((product: any) => {
        const discount = Math.round(((product.price - product.salePrice) / product.price) * 100);
        contextString += `- [${product.name}](/product/${product.slug || product._id}) | Original: ৳${product.price} | Sale Price: ৳${product.salePrice} | Discount: ${discount}% off\n`;
      });
      contextString += `\n`;
    } else {
      contextString += `Products on Discount: No products currently on sale discount.\n\n`;
    }
    // 5. Append general search results
    if (mergedResults.length > 0) {
      mergedResults.forEach((doc, index) => {
        contextString += `[Document ${index + 1}] Source: ${doc.source}\nTitle: ${doc.title}\nContent: ${doc.text}\nURL: ${doc.url}\n\n`;
      });
    }

    return contextString;
  } catch (error) {
    console.error("Error retrieving context from RAG:", error);
    return "Error fetching database context.";
  }
}
