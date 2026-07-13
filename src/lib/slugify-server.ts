import mongoose from 'mongoose';

/**
 * Generates a unique slug by checking the database.
 * If the slug exists, it appends a counter.
 * Supports multi-tenant (domain) scoping.
 */
export async function generateUniqueSlug(
  Model: any, 
  baseSlug: string, 
  idToExclude?: string
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  
  let excludeId: string | undefined = idToExclude;

  while (true) {
    const query: any = { slug };
    if (excludeId) query._id = { $ne: excludeId };
    
    const existing = await Model.findOne(query);
    if (!existing) return slug;
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

