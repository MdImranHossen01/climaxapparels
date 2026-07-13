"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronDown, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Category {
  _id: string;
  name: string;
  slug: string;
  parentCategory?: any;
}

export function CategoryNav({ isScrolled = true }: { isScrolled?: boolean }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const [activeParent, setActiveParent] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCats() {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data.filter((c: any) => c.isActive));
        }
      } catch (e) {
        console.error('Failed to fetch categories');
      }
    }
    fetchCats();
  }, []);

  const mainCategories = categories.filter(c => !c.parentCategory);
  
  const getSubCategories = (parentId: string) => {
    return categories.filter(c => {
        const pId = c.parentCategory?._id || c.parentCategory;
        return pId === parentId;
    });
  };

  return (
    <div 
      className="relative h-full flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setActiveParent(null);
      }}
    >
      <button className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest transition-colors h-full px-1 group ${isScrolled ? 'text-foreground/70 hover:text-primary' : 'text-white/80 hover:text-white'}`}>
        Categories
        <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isHovered ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-[calc(100%-1px)] left-0 min-w-[240px] bg-black/40 dark:bg-black/60 backdrop-blur-2xl shadow-2xl border border-white/10 overflow-visible p-1 z-[100]"
          >
            <div className="flex flex-col">
              {mainCategories.map((mainCat) => {
                const subs = getSubCategories(mainCat._id);
                const hasSubs = subs.length > 0;

                return (
                  <div
                    key={mainCat._id}
                    className="relative group/item"
                    onMouseEnter={() => setActiveParent(mainCat._id)}
                  >
                    <Link
                      href={`/shop?category=${mainCat.slug}`}
                      className={`flex items-center justify-between px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${
                        activeParent === mainCat._id 
                          ? 'bg-primary text-white' 
                          : 'text-white/70 hover:bg-white/5'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {mainCat.name}
                      </span>
                      {hasSubs && <ChevronRight className="h-4 w-4 opacity-50" />}
                    </Link>

                    {/* Subcategories Flyout */}
                    <AnimatePresence>
                      {activeParent === mainCat._id && hasSubs && (
                        <motion.div
                          initial={{ opacity: 0, x: 5 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 5 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          className="absolute left-full top-0 min-w-[220px] bg-black/60 backdrop-blur-3xl shadow-2xl border border-white/10 p-1 ml-[1px]"
                        >
                          <div className="text-[9px] font-black text-white/40 uppercase tracking-widest px-4 py-2 mb-1 border-b border-white/5">
                            {mainCat.name}
                          </div>
                          <div className="flex flex-col">
                            {subs.map((sub) => (
                              <Link
                                key={sub._id}
                                href={`/shop?category=${sub.slug}`}
                                className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white/60 hover:bg-white/5 hover:text-white transition-all whitespace-nowrap"
                              >
                                {sub.name}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
              {mainCategories.length === 0 && (
                <div className="px-4 py-8 text-center text-[10px] font-bold uppercase tracking-widest text-white/30 flex flex-col items-center gap-2">
                    <Package className="h-5 w-5 opacity-20" />
                    Empty Archive
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

