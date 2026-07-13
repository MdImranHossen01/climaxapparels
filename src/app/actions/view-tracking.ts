'use server'

import connectToDatabase from '@/lib/db';
import Blog from '@/models/Blog';
import Product from '@/models/Product';

export async function trackView(id: string, type: 'product' | 'blog') {
  try {
    await connectToDatabase();
    
    if (type === 'blog') {
      await Blog.updateOne({ _id: id }, { $inc: { views: 1 } });
    } else if (type === 'product') {
      await Product.updateOne({ _id: id }, { $inc: { views: 1 } });
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Error tracking ${type} view:`, error);
    return { success: false };
  }
}
