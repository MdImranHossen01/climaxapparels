'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, ChevronDown } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface MobileMenuProps {
  navItems: { href: string; label: string }[];
  categories: any[];
  session: any;
  triggerClassName?: string;
}

export function MobileMenu({ navItems, categories, session, triggerClassName }: MobileMenuProps) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className={`lg:hidden p-2 transition-colors outline-none ${triggerClassName || 'text-foreground hover:text-primary'}`}
          aria-label="Open navigation menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0 border-r-0 pb-20 lg:pb-0">
        <div className="flex flex-col h-full bg-background font-jost">
          {/* Header */}
          <div className="p-6 border-b">
            <Logo onClick={() => setOpen(false)} />
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto py-6 px-4">
            <nav className="flex flex-col gap-2">
              {navItems.map((item, index) => {
                const isActive = pathname === item.href;
                return (
                  <React.Fragment key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all ${
                        isActive 
                        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                        : 'text-foreground/70 hover:bg-muted hover:text-primary'
                      }`}
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </Link>

                    {/* Insert Categories Accordion after Home (index 0) */}
                    {index === 0 && (
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="categories" className="border-none px-4">
                          <AccordionTrigger className="py-3 text-sm font-bold uppercase tracking-widest text-foreground/70 hover:text-primary hover:no-underline">
                            Categories
                          </AccordionTrigger>
                          <AccordionContent className="flex flex-col gap-3 pt-2 pl-4">
                            {categories.map((cat: any) => (
                              <Link
                                key={cat._id}
                                href={`/shop?category=${cat.slug}`}
                                className="text-[11px] font-black uppercase tracking-widest text-foreground/50 hover:text-primary transition-colors"
                                onClick={() => setOpen(false)}
                              >
                                {cat.name}
                              </Link>
                            ))}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>
          </div>

          {/* Footer Actions */}
          {!session && (
            <div className="p-6 border-t bg-muted/30">
              <Link href="/login" onClick={() => setOpen(false)}>
                <button className="w-full py-4 bg-primary text-white font-black uppercase tracking-[0.2em] rounded-xl text-xs shadow-xl shadow-primary/20">
                  Access Account
                </button>
              </Link>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
