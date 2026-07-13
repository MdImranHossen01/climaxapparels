'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Settings2, Palette, Image as ImageIcon, Type, ShoppingBag, Plus, Trash2, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { ImageUpload } from '@/components/ui/image-upload';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  SectionType, 
  LandingPageSection, 
  SectionContent, 
  SectionStyles 
} from '@/lib/landing-page-sections';
import { cn } from '@/lib/utils';

const AVAILABLE_ICONS = [
  { value: 'leaf', label: 'Leaf (প্রাকৃতিক/ন্যাচারাল)' },
  { value: 'truck', label: 'Truck (ডেলিভারি)' },
  { value: 'shield-check', label: 'Shield Check (নিরাপত্তা)' },
  { value: 'zap', label: 'Zap (গতি/ইনস্ট্যান্ট)' },
  { value: 'heart', label: 'Heart (যত্ন/ভালোবাসা)' },
  { value: 'award', label: 'Award (সেরা মান/পুরস্কার)' },
  { value: 'bus', label: 'Bus (পরিবহন)' },
  { value: 'package', label: 'Package (প্যাকেজ/পার্সেল)' },
  { value: 'clock', label: 'Clock (সময়)' },
  { value: 'phone', label: 'Phone (কল/সাপোর্ট)' },
  { value: 'map-pin', label: 'Map Pin (লোকেশন)' },
  { value: 'credit-card', label: 'Credit Card (পেমেন্ট)' },
  { value: 'gift', label: 'Gift (উপহার/অফার)' },
  { value: 'thumbs-up', label: 'Thumbs Up (মতামত)' },
  { value: 'star', label: 'Star (রেটিং)' },
  { value: 'sparkles', label: 'Sparkles (আকর্ষণীয়)' },
  { value: 'percent', label: 'Percent (ডিসকাউন্ট)' },
  { value: 'smile', label: 'Smile (সন্তুষ্টি)' },
  { value: 'check', label: 'Check (যাচাইকৃত)' },
  { value: 'users', label: 'Users (গ্রাহকবৃন্দ)' },
  { value: 'message-square', label: 'Message Square (চ্যাট)' },
  { value: 'refresh-cw', label: 'Refresh (রিটার্ন পলিসি)' },
];

interface SectionSettingsEditorProps {
  section: LandingPageSection | undefined;
  onUpdateContent: (content: SectionContent) => void;
  onUpdateStyles: (styles: SectionStyles) => void;
  onClose: () => void;
}

export default function SectionSettingsEditor({
  section,
  onUpdateContent,
  onUpdateStyles,
  onClose
}: SectionSettingsEditorProps) {
  if (!section) return null;

  const handleContentChange = (key: string, value: any) => {
    onUpdateContent({ ...(section.content || {}), [key]: value });
  };

  const handleStyleChange = (key: string, value: any) => {
    onUpdateStyles({ ...(section.styles || {}), [key]: value });
  };

  const handlePriceChange = (key: string, value: string) => {
    const parsed = parseFloat(value);
    const validatedValue = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
    handleContentChange(key, validatedValue);
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    setSearchTerm('');
    setSearchResults([]);
    setShowDropdown(false);
  }, [section.id]);

  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(searchTerm)}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.products || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const renderProductSelector = (
    onSelectProduct: (product: any) => void,
    currentProductId: string
  ) => {
    return (
      <div className="relative space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="Type product name to search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="rounded-xl pl-8"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            {isSearching && (
              <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
            )}
          </div>
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl"
              onClick={() => {
                setSearchTerm('');
                setSearchResults([]);
                setShowDropdown(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Selected Product Banner */}
        {currentProductId && (
          <div className="text-xs bg-primary/5 text-primary p-2.5 rounded-xl border border-primary/15 flex items-center justify-between">
            <span className="font-semibold truncate max-w-[180px]">
              ID: {currentProductId}
            </span>
            <span className="text-[10px] bg-primary/10 px-2 py-0.5 rounded-full font-bold">
              Linked
            </span>
          </div>
        )}

        {showDropdown && searchTerm.length >= 2 && (
          <div className="absolute z-50 left-0 right-0 mt-1 bg-white border rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y">
            {searchResults.length === 0 ? (
              <div className="p-3 text-xs text-muted-foreground text-center">
                {isSearching ? 'Searching...' : 'No products found'}
              </div>
            ) : (
              searchResults.map((product) => (
                <button
                  key={product._id}
                  type="button"
                  className="w-full text-left p-2.5 hover:bg-muted/50 transition-colors flex items-center gap-3"
                  onClick={() => {
                    onSelectProduct(product);
                    setSearchTerm('');
                    setShowDropdown(false);
                  }}
                >
                  <Image
                    src={product.images?.[0] || '/assets/product-placeholder.webp'}
                    alt={product.name}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-lg object-cover bg-gray-50 border"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate text-gray-800">{product.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      SKU: {product.sku} | ৳{product.salePrice || product.price}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="h-14 border-b flex items-center justify-between px-4 shrink-0">
        <h3 className="font-black text-xs uppercase tracking-widest flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-primary" />
          Section Settings
        </h3>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="content" className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-2 rounded-none bg-gray-50/50 border-b h-12 shrink-0">
          <TabsTrigger value="content" className="rounded-none data-[state=active]:bg-white">Content</TabsTrigger>
          <TabsTrigger value="styles" className="rounded-none data-[state=active]:bg-white">Styles</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto p-4">
          <TabsContent value="content" className="mt-0 space-y-6">
            {/* HERO SECTION EDITOR */}
            {section.type === 'hero' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase opacity-50">Headline</Label>
                  <Input 
                    value={section.content?.headline ?? ''} 
                    onChange={(e) => handleContentChange('headline', e.target.value)} 
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase opacity-50">Sub-headline</Label>
                  <Textarea 
                    value={section.content?.subheadline ?? ''} 
                    onChange={(e) => handleContentChange('subheadline', e.target.value)}
                    className="rounded-xl min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase opacity-50">CTA Button Text</Label>
                  <Input 
                    value={section.content?.ctaText ?? ''} 
                    onChange={(e) => handleContentChange('ctaText', e.target.value)} 
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase opacity-50">Background Image</Label>
                  <ImageUpload 
                    onUpload={(url) => handleContentChange('backgroundImage', url || '')}
                    className="rounded-2xl"
                  />
                </div>
              </div>
            )}

            {/* PRODUCT SHOWCASE EDITOR */}
            {section.type === 'product_showcase' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase opacity-50">Select Product</Label>
                  {renderProductSelector((product) => {
                    onUpdateContent({
                      ...(section.content || {}),
                      productId: product._id,
                      title: product.name,
                      price: product.price,
                      salePrice: product.salePrice || product.price,
                      description: product.description || '',
                      image: product.images?.[0] || '/assets/product-placeholder.webp',
                    });
                  }, section.content?.productId ?? '')}
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase opacity-50">Product ID (Internal)</Label>
                  <Input 
                    placeholder="Search or Paste ID"
                    value={section.content?.productId ?? ''} 
                    onChange={(e) => handleContentChange('productId', e.target.value)} 
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase opacity-50">Custom Title</Label>
                  <Input 
                    value={section.content?.title ?? ''} 
                    onChange={(e) => handleContentChange('title', e.target.value)} 
                    className="rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase opacity-50">Regular Price</Label>
                    <Input 
                      type="number"
                      value={section.content?.price ?? 0} 
                      onChange={(e) => handlePriceChange('price', e.target.value)} 
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase opacity-50">Sale Price</Label>
                    <Input 
                      type="number"
                      value={section.content?.salePrice ?? 0} 
                      onChange={(e) => handlePriceChange('salePrice', e.target.value)} 
                      className="rounded-xl font-bold text-emerald-600"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-bold uppercase opacity-50">Benefits (One per line)</Label>
                   <Textarea 
                      value={(section.content?.benefits ?? []).join('\n')}
                      onChange={(e) => {
                        const lines = e.target.value.split('\n')
                          .map(line => line.trim())
                          .filter(line => line.length > 0);
                        handleContentChange('benefits', lines);
                      }}
                      className="rounded-xl min-h-[100px]"
                   />
                </div>
              </div>
            )}

            {/* ORDER FORM EDITOR */}
            {section.type === 'order_form' && (
               <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase opacity-50">Select Product to Order</Label>
                    {renderProductSelector((product) => {
                      onUpdateContent({
                        ...(section.content || {}),
                        productId: product._id,
                        productName: product.name,
                        price: product.salePrice || product.price,
                        productImage: product.images?.[0] || '/assets/product-placeholder.webp',
                      });
                    }, section.content?.productId ?? '')}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase opacity-50">Product ID (Internal)</Label>
                    <Input 
                      placeholder="Paste ID"
                      value={section.content?.productId ?? ''} 
                      onChange={(e) => handleContentChange('productId', e.target.value)} 
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase opacity-50">Form Title</Label>
                    <Input 
                      value={section.content?.title ?? ''} 
                      onChange={(e) => handleContentChange('title', e.target.value)} 
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase opacity-50">Submit Button Text</Label>
                    <Input 
                      value={section.content?.buttonText ?? ''} 
                      onChange={(e) => handleContentChange('buttonText', e.target.value)} 
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase opacity-50">Instructions (Payment etc.)</Label>
                    <Textarea 
                      value={section.content?.paymentInstructions ?? ''} 
                      onChange={(e) => handleContentChange('paymentInstructions', e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
               </div>
            )}

            {section.type === 'features' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase opacity-50">Grid Title</Label>
                  <Input 
                    value={section.content?.title ?? ''} 
                    onChange={(e) => handleContentChange('title', e.target.value)} 
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase opacity-50">Feature Items</Label>
                  {(section.content?.items ?? []).map((item: any, index: number) => (
                    <div key={index} className="p-3 border rounded-xl space-y-2 bg-gray-50/50 relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500 hover:text-red-700 absolute right-2 top-2"
                        onClick={() => {
                          const newItems = [...(section.content?.items ?? [])];
                          newItems.splice(index, 1);
                          handleContentChange('items', newItems);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <div className="space-y-1">
                        <Label className="text-[9px] uppercase opacity-40">Item Title</Label>
                        <Input
                          value={item.title ?? ''}
                          onChange={(e) => {
                            const newItems = [...(section.content?.items ?? [])];
                            newItems[index] = { ...newItems[index], title: e.target.value };
                            handleContentChange('items', newItems);
                          }}
                          className="h-8 text-xs rounded-lg bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] uppercase opacity-40">Description</Label>
                        <Textarea
                          value={item.description ?? ''}
                          onChange={(e) => {
                            const newItems = [...(section.content?.items ?? [])];
                            newItems[index] = { ...newItems[index], description: e.target.value };
                            handleContentChange('items', newItems);
                          }}
                          className="text-xs rounded-lg min-h-[50px] bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] uppercase opacity-40 font-bold text-gray-500">Select Icon</Label>
                        <Select
                          value={item.icon || 'shield-check'}
                          onValueChange={(val) => {
                            const newItems = [...(section.content?.items ?? [])];
                            newItems[index] = { ...newItems[index], icon: val };
                            handleContentChange('items', newItems);
                          }}
                        >
                          <SelectTrigger className="h-9 rounded-lg text-xs bg-white border border-gray-200">
                            <SelectValue placeholder="Select an icon" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border rounded-xl shadow-xl max-h-60 overflow-y-auto">
                            {AVAILABLE_ICONS.map((ico) => (
                              <SelectItem key={ico.value} value={ico.value} className="text-xs focus:bg-gray-100 hover:bg-gray-50 cursor-pointer">
                                {ico.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full rounded-xl text-xs gap-1.5"
                    onClick={() => {
                      const newItems = [
                        ...(section.content?.items ?? []),
                        { title: 'New Feature', description: 'Describe your feature here.', icon: 'leaf' }
                      ];
                      handleContentChange('items', newItems);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Feature Item
                  </Button>
                </div>
              </div>
            )}

            {section.type === 'testimonials' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase opacity-50">Section Title</Label>
                  <Input 
                    value={section.content?.title ?? ''} 
                    onChange={(e) => handleContentChange('title', e.target.value)} 
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase opacity-50">Reviews</Label>
                  {(section.content?.reviews ?? []).map((review: any, index: number) => (
                    <div key={index} className="p-3 border rounded-xl space-y-2 bg-gray-50/50 relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500 hover:text-red-700 absolute right-2 top-2"
                        onClick={() => {
                          const newReviews = [...(section.content?.reviews ?? [])];
                          newReviews.splice(index, 1);
                          handleContentChange('reviews', newReviews);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[9px] uppercase opacity-40">Name</Label>
                          <Input
                            value={review.name ?? ''}
                            onChange={(e) => {
                              const newReviews = [...(section.content?.reviews ?? [])];
                              newReviews[index] = { ...newReviews[index], name: e.target.value };
                              handleContentChange('reviews', newReviews);
                            }}
                            className="h-8 text-xs rounded-lg bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] uppercase opacity-40">Role</Label>
                          <Input
                            value={review.role ?? ''}
                            onChange={(e) => {
                              const newReviews = [...(section.content?.reviews ?? [])];
                              newReviews[index] = { ...newReviews[index], role: e.target.value };
                              handleContentChange('reviews', newReviews);
                            }}
                            className="h-8 text-xs rounded-lg bg-white"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] uppercase opacity-40">Review Content</Label>
                        <Textarea
                          value={review.content ?? ''}
                          onChange={(e) => {
                            const newReviews = [...(section.content?.reviews ?? [])];
                            newReviews[index] = { ...newReviews[index], content: e.target.value };
                            handleContentChange('reviews', newReviews);
                          }}
                          className="text-xs rounded-lg min-h-[50px] bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] uppercase opacity-40">Rating (1-5)</Label>
                        <Input
                          type="number"
                          min="1"
                          max="5"
                          value={review.rating ?? 5}
                          onChange={(e) => {
                            const newReviews = [...(section.content?.reviews ?? [])];
                            newReviews[index] = { ...newReviews[index], rating: parseInt(e.target.value) || 5 };
                            handleContentChange('reviews', newReviews);
                          }}
                          className="h-8 text-xs rounded-lg bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] uppercase opacity-40 font-bold text-gray-500">Customer Photo</Label>
                        <ImageUpload 
                          value={review.avatar ?? ''}
                          onUpload={(url) => {
                            const newReviews = [...(section.content?.reviews ?? [])];
                            newReviews[index] = { ...newReviews[index], avatar: url || '' };
                            handleContentChange('reviews', newReviews);
                          }}
                          aspect="square"
                          className="rounded-xl"
                        />
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full rounded-xl text-xs gap-1.5"
                    onClick={() => {
                      const newReviews = [
                        ...(section.content?.reviews ?? []),
                        { name: 'Customer Name', role: 'Verified Purchase', content: 'Great product and quick support!', rating: 5 }
                      ];
                      handleContentChange('reviews', newReviews);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Review
                  </Button>
                </div>
              </div>
            )}

            {section.type === 'faq' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase opacity-50">FAQ Title</Label>
                  <Input 
                    value={section.content?.title ?? ''} 
                    onChange={(e) => handleContentChange('title', e.target.value)} 
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase opacity-50">FAQ Items</Label>
                  {(section.content?.items ?? []).map((item: any, index: number) => (
                    <div key={index} className="p-3 border rounded-xl space-y-2 bg-gray-50/50 relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500 hover:text-red-700 absolute right-2 top-2"
                        onClick={() => {
                          const newItems = [...(section.content?.items ?? [])];
                          newItems.splice(index, 1);
                          handleContentChange('items', newItems);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <div className="space-y-1">
                        <Label className="text-[9px] uppercase opacity-40">Question</Label>
                        <Input
                          value={item.question ?? ''}
                          onChange={(e) => {
                            const newItems = [...(section.content?.items ?? [])];
                            newItems[index] = { ...newItems[index], question: e.target.value };
                            handleContentChange('items', newItems);
                          }}
                          className="h-8 text-xs rounded-lg bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] uppercase opacity-40">Answer</Label>
                        <Textarea
                          value={item.answer ?? ''}
                          onChange={(e) => {
                            const newItems = [...(section.content?.items ?? [])];
                            newItems[index] = { ...newItems[index], answer: e.target.value };
                            handleContentChange('items', newItems);
                          }}
                          className="text-xs rounded-lg min-h-[50px] bg-white"
                        />
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full rounded-xl text-xs gap-1.5"
                    onClick={() => {
                      const newItems = [
                        ...(section.content?.items ?? []),
                        { question: 'Enter Question Here', answer: 'Enter Answer Here.' }
                      ];
                      handleContentChange('items', newItems);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add FAQ Item
                  </Button>
                </div>
              </div>
            )}

            {section.type === 'video' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase opacity-50">Section Title</Label>
                  <Input 
                    value={section.content?.title ?? ''} 
                    onChange={(e) => handleContentChange('title', e.target.value)} 
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase opacity-50">Video URL (YouTube or Vimeo)</Label>
                  <Input 
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={section.content?.videoUrl ?? ''} 
                    onChange={(e) => handleContentChange('videoUrl', e.target.value)} 
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase opacity-50">Custom Thumbnail (Optional)</Label>
                  <ImageUpload 
                    onUpload={(url) => handleContentChange('thumbnail', url || '')}
                    className="rounded-2xl"
                  />
                </div>
              </div>
            )}

            {section.type === 'content_block' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase opacity-50">HTML / Text Content</Label>
                  <Textarea 
                    value={section.content?.content ?? ''} 
                    onChange={(e) => handleContentChange('content', e.target.value)}
                    className="rounded-xl min-h-[200px] font-mono text-xs"
                    placeholder="<p>Enter HTML or plain text...</p>"
                  />
                </div>
              </div>
            )}

            {/* Default Placeholder */}
            {!['hero', 'product_showcase', 'order_form', 'features', 'testimonials', 'faq', 'video', 'content_block'].includes(section.type) && (
              <div className="py-10 text-center text-muted-foreground italic text-sm">
                Advanced editor for this section type is coming soon.
              </div>
            )}
          </TabsContent>

          <TabsContent value="styles" className="mt-0 space-y-6">
             <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase opacity-50">Background Color</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {['#ffffff', '#f9fafb', '#f3f4f6', '#111827', '#065f46'].map(color => (
                      <button 
                        key={color}
                        onClick={() => handleStyleChange('backgroundColor', color)}
                        className={cn(
                          "h-8 rounded-lg border shadow-sm transition-all",
                          section.styles?.backgroundColor === color ? "ring-2 ring-primary ring-offset-2" : ""
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-bold uppercase opacity-50">Padding Vertical</Label>
                   <div className="grid grid-cols-3 gap-2">
                      {['py-4', 'py-12', 'py-24'].map(p => (
                        <Button 
                          key={p} 
                          variant={section.styles?.paddingTop === p ? 'default' : 'outline'}
                          size="sm"
                          className="text-xs rounded-lg"
                          onClick={() => {
                            handleStyleChange('paddingTop', p);
                            handleStyleChange('paddingBottom', p);
                          }}
                        >
                          {p === 'py-4' ? 'Compact' : p === 'py-12' ? 'Standard' : 'Spacious'}
                        </Button>
                      ))}
                   </div>
                </div>
             </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
