import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import connectToDatabase from '@/lib/db';
import LandingPage from '@/models/LandingPage';
import { getCachedSettings } from '@/lib/data-fetching';

// We will build these components next
import HeroSection from '@/app/(public)/lp/[slug]/_components/HeroSection';
import ProductShowcase from '@/app/(public)/lp/[slug]/_components/ProductShowcase';
import FeaturesGrid from '@/app/(public)/lp/[slug]/_components/FeaturesGrid';
import OrderForm from '@/app/(public)/lp/[slug]/_components/OrderForm';
import TestimonialsSection from '@/app/(public)/lp/[slug]/_components/TestimonialsSection';
import VideoSection from '@/app/(public)/lp/[slug]/_components/VideoSection';
import FAQSection from '@/app/(public)/lp/[slug]/_components/FAQSection';
import ContentBlock from '@/app/(public)/lp/[slug]/_components/ContentBlock';
import FloatingLPBar from '@/app/(public)/lp/[slug]/_components/FloatingLPBar';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  await connectToDatabase();
  const { slug } = await params;
  const page = await LandingPage.findOne({ slug });
  
  if (!page) return { title: 'Page Not Found' };

  return {
    title: page.seoConfig?.metaTitle || page.title,
    description: page.seoConfig?.metaDescription || page.description,
    openGraph: {
      images: page.seoConfig?.ogImage ? [page.seoConfig.ogImage] : [],
    }
  };
}

export default async function PublicLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  await connectToDatabase();
  const { slug } = await params;
  const page = await LandingPage.findOne({ slug });
  const settings = await getCachedSettings();

  if (!page || !page.isActive) {
    notFound();
  }

  // Tracking view (non-blocking)
  LandingPage.updateOne({ _id: page._id }, { $inc: { viewCount: 1 } })
    .catch(err => console.error('Failed to track view:', err));

  // Ensure there is always a Direct Order Form on the page (at the very bottom by default)
  const sections = [...(page.sections || [])];
  const hasOrderForm = sections.some((s: any) => s.type === 'order_form');
  
  if (!hasOrderForm) {
    // Try to find product showcase to pre-populate product info
    const productShowcase = sections.find((s: any) => s.type === 'product_showcase');
    const productDetails = productShowcase?.content ? {
      productId: productShowcase.content.productId || '',
      productName: productShowcase.content.title || '',
      price: productShowcase.content.salePrice || productShowcase.content.price || 0,
      productImage: productShowcase.content.image || '',
    } : {};

    sections.push({
      id: 'default-order-form-section',
      type: 'order_form',
      content: {
        title: 'অর্ডার করতে নিচের ফর্মটি পূরণ করুন',
        buttonText: 'অর্ডার নিশ্চিত করুন',
        showQuantity: true,
        defaultQuantity: 1,
        paymentInstructions: 'ডেলিভারি ম্যানের কাছে টাকা পেমেন্ট করুন।',
        ...productDetails
      },
      styles: {
        paddingTop: 'py-12',
        paddingBottom: 'py-24',
      }
    });
  } else {
    // If order form exists but lacks product details, fill them in from showcase
    const idx = sections.findIndex((s: any) => s.type === 'order_form');
    if (idx !== -1 && !sections[idx].content?.productId) {
      const productShowcase = sections.find((s: any) => s.type === 'product_showcase');
      if (productShowcase?.content) {
        sections[idx] = {
          ...sections[idx],
          content: {
            ...sections[idx].content,
            productId: productShowcase.content.productId || '',
            productName: productShowcase.content.title || '',
            price: productShowcase.content.salePrice || productShowcase.content.price || 0,
            productImage: productShowcase.content.image || '',
          }
        };
      }
    }
  }

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-24">
      {sections.map((section: any) => {
        const SectionComponent = getComponent(section.type);
        if (!SectionComponent) return null;

        return (
          <section 
            key={section.id} 
            style={{ backgroundColor: section.styles?.backgroundColor }}
            className={section.styles?.paddingTop || 'py-12'}
          >
            <SectionComponent 
              content={section.content} 
              styles={section.styles} 
              settings={settings}
            />
          </section>
        );
      })}
      <FloatingLPBar whatsappNumber={settings?.socialLinks?.whatsapp} />
    </div>
  );
}

function getComponent(type: string) {
  switch (type) {
    case 'hero': return HeroSection;
    case 'product_showcase': return ProductShowcase;
    case 'features': return FeaturesGrid;
    case 'order_form': return OrderForm;
    case 'testimonials': return TestimonialsSection;
    case 'video': return VideoSection;
    case 'faq': return FAQSection;
    case 'content_block': return ContentBlock;
    default: return null;
  }
}
