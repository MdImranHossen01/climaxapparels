'use client'; 

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FAQSection({ content }: { content: any }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleIndex = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="container mx-auto px-4 max-w-3xl">
      <h2 className="text-3xl font-black mb-8 text-center">{content.title}</h2>
      <div className="space-y-4">
        {(content.items || []).map((item: any, idx: number) => {
          const isOpen = openIndex === idx;
          return (
            <div 
              key={idx} 
              className="border-2 border-gray-100 rounded-2xl bg-white shadow-sm overflow-hidden transition-all duration-300"
            >
              <button
                type="button"
                className="w-full flex items-center justify-between p-5 text-left font-bold text-gray-900 hover:bg-gray-50/50 transition-colors"
                onClick={() => toggleIndex(idx)}
              >
                <span className="pr-4">{item.question}</span>
                <ChevronDown 
                  className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform duration-300 shrink-0",
                    isOpen && "rotate-180 text-primary"
                  )}
                />
              </button>
              
              <div 
                className={cn(
                  "grid transition-all duration-300 ease-in-out",
                  isOpen ? "grid-rows-[1fr] border-t border-gray-100" : "grid-rows-[0fr]"
                )}
              >
                <div className="overflow-hidden">
                  <div className="p-5 text-sm text-gray-600 leading-relaxed bg-gray-50/20">
                    {item.answer}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
