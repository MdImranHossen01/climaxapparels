export type SectionType = 
  | 'hero' 
  | 'product_showcase' 
  | 'features' 
  | 'testimonials' 
  | 'faq' 
  | 'video' 
  | 'order_form' 
  | 'content_block';

export interface SectionContent {
  [key: string]: any;
}

export interface SectionStyles {
  backgroundColor?: string;
  paddingTop?: string;
  paddingBottom?: string;
  [key: string]: any;
}

export interface LandingPageSection {
  id: string;
  type: SectionType;
  content: SectionContent;
  styles?: SectionStyles;
}

export interface SectionTemplate {
  type: SectionType;
  label: string;
  description: string;
  icon: string;
  defaultContent: SectionContent;
}

export const SECTION_TEMPLATES: SectionTemplate[] = [
  {
    type: 'hero',
    label: 'Hero Section',
    description: 'Main banner with headline and CTA',
    icon: 'layout',
    defaultContent: {
      headline: 'Transform Your Health Naturally',
      subheadline: 'Discover the power of alternative medicine with our premium products.',
      ctaText: 'Shop Now',
      ctaLink: '#order',
      backgroundImage: '/assets/hero-placeholder.webp',
      overlayOpacity: 0.5,
    }
  },
  {
    type: 'product_showcase',
    label: 'Product Highlight',
    description: 'Detailed view of a single product',
    icon: 'shopping-bag',
    defaultContent: {
      productId: '',
      title: 'Premium Health Booster',
      price: 1250,
      salePrice: 990,
      description: 'Our most popular supplement for daily energy and immunity.',
      image: '/assets/product-placeholder.webp',
      benefits: ['100% Organic', 'No Side Effects', 'Fast Results'],
    }
  },
  {
    type: 'order_form',
    label: 'Direct Order Form',
    description: 'High-converting checkout form',
    icon: 'credit-card',
    defaultContent: {
      title: 'অর্ডার করতে নিচের ফর্মটি পূরণ করুন',
      buttonText: 'অর্ডার নিশ্চিত করুন',
      showQuantity: true,
      defaultQuantity: 1,
      paymentInstructions: 'ডেলিভারি ম্যানের কাছে টাকা পেমেন্ট করুন।',
    }
  },
  {
    type: 'features',
    label: 'Features Grid',
    description: 'Display benefits or features with icons',
    icon: 'grid',
    defaultContent: {
      title: 'কেন আমাদের পছন্দ করবেন?',
      items: [
        { title: 'প্রাকৃতিক উপাদান', description: 'আমরা শতভাগ প্রাকৃতিক উপাদান ব্যবহার করি।', icon: 'leaf' },
        { title: 'দ্রুত ডেলিভারি', description: '২৪-৪৮ ঘণ্টার মধ্যে হোম ডেলিভারি।', icon: 'truck' },
        { title: 'ক্যাশ অন ডেলিভারি', description: 'পণ্য হাতে পেয়ে টাকা পরিশোধের সুবিধা।', icon: 'shield-check' },
      ]
    }
  },
  {
    type: 'video',
    label: 'Video Section',
    description: 'Embed a YouTube or Vimeo video',
    icon: 'play-circle',
    defaultContent: {
      title: 'আমাদের পণ্য সম্পর্কে আরও জানুন',
      videoUrl: '',
      thumbnail: '',
    }
  },
  {
    type: 'testimonials',
    label: 'Testimonials',
    description: 'What your customers say',
    icon: 'message-square',
    defaultContent: {
      title: 'আমাদের কাস্টমারদের মতামত',
      reviews: [
        { name: 'আরিফ আহমেদ', role: 'নিয়মিত গ্রাহক', content: 'অসাধারণ পণ্য! আমি গত ২ মাস ধরে ব্যবহার করছি এবং খুব ভালো ফলাফল পেয়েছি।', rating: 5 },
        { name: 'সাদিয়া ইসলাম', role: 'গৃহিণী', content: 'খুবই দ্রুত ডেলিভারি পেয়েছি। পণ্যের গুণগত মান নিয়ে কোনো সন্দেহ নেই।', rating: 5 },
      ]
    }
  },
  {
    type: 'faq',
    label: 'FAQ Section',
    description: 'Frequently Asked Questions',
    icon: 'help-circle',
    defaultContent: {
      title: 'সচরাচর জিজ্ঞাসিত প্রশ্নসমূহ',
      items: [
        { question: 'কিভাবে অর্ডার করবো?', answer: 'অর্ডার করতে ল্যান্ডিং পেজের নিচের ফর্মটি পূরণ করুন অথবা আমাদের কল করুন।' },
        { question: 'ডেলিভারি চার্জ কত?', answer: 'ঢাকার ভিতরে ৬০ টাকা এবং ঢাকার বাইরে ১২০ টাকা।' },
      ]
    }
  },
  {
    type: 'content_block',
    label: 'Rich Text Block',
    description: 'Add paragraphs, lists, and images',
    icon: 'file-text',
    defaultContent: {
      content: '<p>আপনার পছন্দের লেখা এখানে লিখুন...</p>',
    }
  }
];
