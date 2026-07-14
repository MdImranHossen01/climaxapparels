'use client';

import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FloatingLPBarProps {
  whatsappNumber?: string;
}

export default function FloatingLPBar({ whatsappNumber }: FloatingLPBarProps) {
  const handleScrollToOrder = () => {
    const element = document.getElementById('order');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Extract digits for WhatsApp link
  const cleanWhatsappNumber = whatsappNumber ? whatsappNumber.replace(/[^0-9]/g, '') : '';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-zinc-800/80 flex items-center justify-center gap-3 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] animate-in slide-in-from-bottom duration-300 md:py-3.5">
      {whatsappNumber && cleanWhatsappNumber && (
        <a
          href={`https://wa.me/${cleanWhatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center h-12 w-12 bg-[#25D366] hover:bg-[#20ba5a] hover:scale-105 text-white rounded-xl shadow-lg shadow-emerald-500/20 transition-all duration-200 shrink-0"
          aria-label="Order via WhatsApp"
        >
          <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
        </a>
      )}
      <Button
        onClick={handleScrollToOrder}
        className="flex-1 max-w-md h-12 bg-primary hover:bg-primary/95 text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/10 hover:scale-[1.01] active:scale-95 transition-all duration-200"
      >
        <ShoppingCart className="h-5 w-5" /> Shop Now
      </Button>
    </div>
  );
}
