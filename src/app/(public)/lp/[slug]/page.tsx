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

  return (
    <div className="min-h-screen bg-white">
      {page.sections.map((section: any) => {
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
