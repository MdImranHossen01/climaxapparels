'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Import actual components for real-time canvas rendering
import HeroSection from '@/app/(public)/lp/[slug]/_components/HeroSection';
import ProductShowcase from '@/app/(public)/lp/[slug]/_components/ProductShowcase';
import FeaturesGrid from '@/app/(public)/lp/[slug]/_components/FeaturesGrid';
import OrderForm from '@/app/(public)/lp/[slug]/_components/OrderForm';
import TestimonialsSection from '@/app/(public)/lp/[slug]/_components/TestimonialsSection';
import VideoSection from '@/app/(public)/lp/[slug]/_components/VideoSection';
import FAQSection from '@/app/(public)/lp/[slug]/_components/FAQSection';
import ContentBlock from '@/app/(public)/lp/[slug]/_components/ContentBlock';

interface SortableSectionItemProps {
  section: any;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
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

export default function SortableSectionItem({ 
  section, 
  isSelected, 
  onSelect, 
  onDelete 
}: SortableSectionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  const getSectionLabel = (type: string) => {
    switch (type) {
      case 'hero': return 'Hero Banner';
      case 'product_showcase': return 'Product Highlight';
      case 'order_form': return 'Checkout Form';
      case 'features': return 'Features Grid';
      case 'video': return 'Video Player';
      case 'testimonials': return 'Customer Reviews';
      case 'faq': return 'FAQ Accordion';
      case 'content_block': return 'Rich Text';
      default: return 'Generic Section';
    }
  };

  const SectionComponent = getComponent(section.type);

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={cn(
        "group relative border-b last:border-b-0 transition-all cursor-default",
        isSelected ? "ring-2 ring-primary ring-inset z-10" : "hover:bg-gray-50/50"
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Selection Indicator & Label */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1 transition-all",
        isSelected ? "bg-primary" : "bg-transparent group-hover:bg-gray-200"
      )} />
      
      <div className="absolute left-4 top-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
        <div 
          {...attributes} 
          {...listeners} 
          className="p-1 bg-white border shadow-sm rounded cursor-grab active:cursor-grabbing hover:text-primary transition-colors"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="px-2 py-0.5 bg-white border shadow-sm rounded text-[10px] font-black uppercase tracking-widest">
          {getSectionLabel(section.type)}
        </div>
      </div>

      <div className="absolute right-4 top-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
        <Button 
          variant="secondary" 
          size="icon" 
          className="h-8 w-8 bg-white border shadow-sm hover:text-red-500"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Actual Content Preview (Live Render) */}
      <div 
        className={cn("pointer-events-none select-none overflow-hidden", section.styles?.paddingTop || 'py-12')}
        style={{ backgroundColor: section.styles?.backgroundColor }}
      >
        {SectionComponent ? (
          <SectionComponent 
            content={section.content} 
            styles={section.styles} 
            settings={{ deliveryChargeInsideDhaka: 60, deliveryChargeOutsideDhaka: 120 }}
          />
        ) : (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
            <Code className="h-8 w-8 opacity-40" />
            <span className="text-[10px] font-bold uppercase">{getSectionLabel(section.type)} PREVIEW</span>
          </div>
        )}
      </div>
    </div>
  );
}
