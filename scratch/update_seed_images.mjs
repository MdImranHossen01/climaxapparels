import fs from 'fs';

const mapping = JSON.parse(fs.readFileSync('scratch/product_image_mapping.json', 'utf8'));
let seedContent = fs.readFileSync('scripts/seed-fashion.mjs', 'utf8');

// Update rawProducts array items with images
for (const slug in mapping) {
    const imagesStr = JSON.stringify(mapping[slug]);
    // Look for the object with the slug
    const slugPattern = new RegExp(`{ name: "[^"]+", slug: "${slug}",[^}]*}`, 'g');
    
    seedContent = seedContent.replace(slugPattern, (m) => {
        // If images: [...] already exists, replace it
        if (m.includes('images: [')) {
            return m.replace(/images: \[[^\]]*\],/, `images: ${imagesStr},`);
        } else {
            // Insert images: [...] after slug: "...",
            return m.replace(`slug: "${slug}",`, `slug: "${slug}", images: ${imagesStr},`);
        }
    });
}

// Ensure productDocs uses images: p.images || [p.img]
if (!seedContent.includes('images: p.images || [p.img],')) {
    seedContent = seedContent.replace('images: [p.img],', 'images: p.images || [p.img],');
}

fs.writeFileSync('scripts/seed-fashion.mjs', seedContent);
console.log('seed-fashion.mjs updated with product images.');
