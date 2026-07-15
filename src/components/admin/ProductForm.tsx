/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useForm, useFieldArray, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Trash, 
  Loader2, 
  ArrowLeft,
  X,
  PlusCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/ui/image-upload';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { 
  RadioGroup, 
  RadioGroupItem 
} from '@/components/ui/radio-group';
import { slugify, sanitizeSlugInput } from '@/lib/slugify';

const NovelEditor = dynamic(() => import('@/components/editor/NovelEditor'), {
  ssr: false,
  loading: () => <div className="h-[200px] w-full animate-pulse bg-muted rounded-md" />
});

const productSchema = z.object({
  name: z.string().min(3, 'Name is required'),
  slug: z.string().min(3, 'Slug is required'),
  description: z.string().min(10, 'Description is required'),
  price: z.union([z.coerce.number().positive('Price must be greater than zero'), z.literal('')]),
  purchasePrice: z.union([z.coerce.number().min(0), z.literal('')]).optional(),
  discountRate: z.union([z.coerce.number().min(0).max(100), z.literal('')]).optional(),
  salePrice: z.union([z.coerce.number().min(0), z.literal('')]).optional(),
  sku: z.string().min(3, 'SKU is required'),
  stock: z.union([z.coerce.number().int().min(0, 'Stock must be at least 0'), z.literal('')]),
  categories: z.array(z.string()).min(1, 'Select at least one category'),
  images: z.array(z.string()).min(1, 'Upload at least one image'),
  isFeatured: z.boolean(),
  isNewArrival: z.boolean(),
  isFlashSale: z.boolean().optional(),
  isPublished: z.boolean(),
  attributes: z.array(z.object({
    key: z.string(),
    value: z.string()
  })),
  variants: z.array(z.object({
    color: z.string().optional(),
    images: z.array(z.string()).default([]),
    sizes: z.array(z.object({
      size: z.string().optional(),
      price: z.union([z.coerce.number().min(0), z.literal('')]).optional(),
      purchasePrice: z.union([z.coerce.number().min(0), z.literal('')]).optional(),
      discountRate: z.union([z.coerce.number().min(0).max(100), z.literal('')]).optional(),
      salePrice: z.union([z.coerce.number().min(0), z.literal('')]).optional(),
      stock: z.union([z.coerce.number().min(0), z.literal('')]).optional(),
      sku: z.string().optional(),
    })).default([]),
  })).default([]),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: any;
}

export function ProductForm({ initialData }: ProductFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const calculateDiscount = (price: number, salePrice?: number) => {
    if (!price || !salePrice || salePrice >= price) return 0;
    return Math.round((1 - salePrice / price) * 100);
  };

  const defaultValues: ProductFormValues = {
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    description: initialData?.description || '',
    price: initialData?.price ?? '',
    purchasePrice: initialData?.purchasePrice ?? '',
    discountRate: calculateDiscount(initialData?.price, initialData?.salePrice) || '',
    salePrice: initialData?.salePrice ?? '',
    sku: initialData?.sku || '',
    stock: initialData?.stock ?? '',
    categories: initialData?.categories?.map((c: any) => typeof c === 'object' ? c._id : c) || [],
    images: initialData?.images || [],
    isPublished: initialData?.isPublished ?? true,
    isFeatured: initialData?.isFeatured ?? false,
    isNewArrival: initialData?.isNewArrival ?? false,
    isFlashSale: initialData?.isFlashSale ?? false,
    attributes: initialData?.attributes || [],
    variants: (() => {
      if (!initialData?.variants) return [];
      const colorGroups: Record<string, { color: string; images: string[]; sizes: any[] }> = {};
      initialData.variants.forEach((v: any) => {
        const colorKey = v.color || '';
        if (!colorGroups[colorKey]) {
          const variantImages: string[] = [];
          if (v.images && Array.isArray(v.images)) {
            variantImages.push(...v.images);
          } else if (v.image) {
            variantImages.push(v.image);
          }
          colorGroups[colorKey] = {
            color: v.color || '',
            images: variantImages,
            sizes: []
          };
        } else {
          if (v.images && Array.isArray(v.images)) {
            v.images.forEach((img: string) => {
              if (!colorGroups[colorKey].images.includes(img)) {
                colorGroups[colorKey].images.push(img);
              }
            });
          } else if (v.image && !colorGroups[colorKey].images.includes(v.image)) {
            colorGroups[colorKey].images.push(v.image);
          }
        }
        colorGroups[colorKey].sizes.push({
          size: v.size || '',
          price: v.price ?? '',
          purchasePrice: v.purchasePrice ?? '',
          stock: v.stock ?? '',
          discountRate: calculateDiscount(v.price, v.salePrice) || '',
          salePrice: v.salePrice ?? '',
          sku: v.sku || ''
        });
      });
      return Object.values(colorGroups);
    })() || [],
  };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "attributes"
  });
  
  const { fields: variantFields, append: appendVariant, remove: removeVariant, replace: replaceVariants } = useFieldArray({
    control: form.control,
    name: "variants"
  });

  // Generation tool removed as variants are now managed directly

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories');
        if (!res.ok) throw new Error('Failed to fetch categories');
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
        toast.error('Failed to load categories');
      }
    }
    fetchCategories();
  }, []);

  const nameValue = form.watch('name');
  useEffect(() => {
    if (nameValue && !initialData) {
      form.setValue('slug', slugify(nameValue));
    }
  }, [nameValue, form, initialData]);

  const onSubmit = async (values: ProductFormValues) => {
    setLoading(true);
    const flatVariants: any[] = [];
    (values.variants || []).forEach((cGroup: any) => {
      (cGroup.sizes || []).forEach((sizeInfo: any) => {
        flatVariants.push({
          color: cGroup.color || '',
          images: cGroup.images || [],
          image: cGroup.images?.[0] || '', // Legacy support
          size: sizeInfo.size || '',
          price: sizeInfo.price === '' ? 0 : Number(sizeInfo.price),
          purchasePrice: sizeInfo.purchasePrice === '' ? undefined : Number(sizeInfo.purchasePrice),
          salePrice: sizeInfo.salePrice === '' ? undefined : Number(sizeInfo.salePrice),
          discountRate: sizeInfo.discountRate === '' || isNaN(Number(sizeInfo.discountRate)) ? undefined : Number(sizeInfo.discountRate),
          stock: sizeInfo.stock === '' ? 0 : Number(sizeInfo.stock),
          sku: sizeInfo.sku || '',
        });
      });
    });

    const cleanValues = {
      ...values,
      price: values.price === '' ? 0 : Number(values.price),
      purchasePrice: values.purchasePrice === '' ? undefined : Number(values.purchasePrice),
      salePrice: values.salePrice === '' ? undefined : Number(values.salePrice),
      discountRate: values.discountRate === '' || isNaN(Number(values.discountRate)) ? undefined : Number(values.discountRate),
      stock: values.stock === '' ? 0 : Number(values.stock),
      variants: flatVariants,
    };

    try {
      const url = initialData ? `/api/products/${initialData._id}` : '/api/products';
      const method = initialData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanValues),
      });

      if (response.ok) {
        toast.success(`Product ${initialData ? 'updated' : 'created'} successfully`);
        router.push('/admin/products');
        router.refresh();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Something went wrong');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const addImage = (url: string) => {
    const currentImages = form.getValues('images');
    form.setValue('images', [...currentImages, url], {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const removeImage = (url: string) => {
    const currentImages = form.getValues('images');
    form.setValue('images', currentImages.filter(i => i !== url), {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const toggleCategory = (catId: string) => {
    const currentCats = form.getValues('categories');
    const category = categories.find(c => c._id === catId);
    if (!category) return;

    if (currentCats.includes(catId)) {
      // Removing category
      let newCats = currentCats.filter(id => id !== catId);
      
      // If it's a main category (no parent), also remove its subcategories
      if (!category.parentCategory) {
        newCats = newCats.filter(id => {
          const sub = categories.find(c => c._id === id);
          const parentId = sub?.parentCategory?._id || sub?.parentCategory;
          return parentId !== catId;
        });
      }

      form.setValue('categories', newCats, {
        shouldValidate: true,
        shouldDirty: true,
      });
    } else {
      // Adding category
      form.setValue('categories', [...currentCats, catId], {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  const selectedCats = form.watch('categories');
  const mainCategories = categories.filter((cat) => !cat.parentCategory);
  const selectedMainCategoryIds = mainCategories
    .filter(mc => selectedCats.includes(mc._id))
    .map(mc => mc._id);

  // Validation Check: ensure at least one main category is selected
  const hasMainCategory = selectedMainCategoryIds.length > 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">
              {initialData ? 'Edit' : 'Add'} Product
            </h1>
          </div>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Product
          </Button>
        </div>

        <div className="max-w-5xl mx-auto w-full space-y-6">
          {/* Product Information */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter product name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="product-slug" 
                            {...field} 
                            onChange={(e) => {
                              field.onChange(sanitizeSlugInput(e.target.value));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input placeholder="STK-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <div className="min-h-[300px] border rounded-md overflow-hidden bg-background prose-sm max-w-none">
                          <NovelEditor 
                            initialValue={(() => {
                              try {
                                return field.value ? JSON.parse(field.value) : undefined;
                              } catch (e) {
                                // Fallback for plain text description
                                return {
                                  type: 'doc',
                                  content: [{ type: 'paragraph', content: [{ type: 'text', text: field.value }] }]
                                };
                              }
                            })()} 
                            onChange={field.onChange} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Gallery Images</Label>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {form.watch('images').map((url, index) => (
                    <div key={`${url}-${index}`} className="relative aspect-square rounded-md overflow-hidden border bg-muted">
                      <Image 
                        src={url} 
                        alt={`Product image ${index + 1}`} 
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        className="object-cover" 
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(url)}
                        className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 z-10"
                        aria-label={`Remove product image ${index + 1}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <ImageUpload onUpload={addImage} compact />
                </div>
                {form.formState.errors.images?.message && (
                  <p className="text-[0.8rem] font-medium text-destructive">
                    {form.formState.errors.images.message}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Attributes (Size, Color, etc.)</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ key: '', value: '' })}>
                    <Plus className="mr-2 h-4 w-4" /> Add Attribute
                  </Button>
                </div>
                <div className="space-y-4">
                  {fields.map((item, index) => (
                    <div key={item.id} className="flex gap-4 items-end">
                      <div className="flex-1">
                        <Label>Label</Label>
                        <Input {...form.register(`attributes.${index}.key` as const)} placeholder="e.g. Material" />
                      </div>
                      <div className="flex-1">
                        <Label>Value</Label>
                        <Input {...form.register(`attributes.${index}.value` as const)} placeholder="e.g. Cotton" />
                      </div>
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive" 
                        onClick={() => remove(index)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 shadow-sm overflow-hidden">
              <div className="bg-primary/5 px-6 py-4 border-b border-primary/10 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                    <PlusCircle className="h-5 w-5" /> 
                    Variation Manager
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Manage images and sizes for each color variant.</p>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="bg-background hover:bg-primary hover:text-white transition-all border-primary/20"
                  onClick={() => appendVariant({ color: '', images: [], sizes: [{ size: '', price: form.getValues('price') || '', stock: '', sku: '' }] })}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Color Variant
                </Button>
              </div>
              <CardContent className="p-6">
                {variantFields.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed border-muted rounded-xl text-muted-foreground italic text-sm">
                    No variations added yet. Click &quot;Add Color Variant&quot; to start.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {variantFields.map((field, colorIndex) => {
                      const colorImages = form.watch(`variants.${colorIndex}.images`) || [];
                      
                      return (
                        <div key={field.id} className="border border-muted rounded-xl p-4 md:p-6 bg-muted/10 relative space-y-6">
                          <button
                            type="button"
                            onClick={() => removeVariant(colorIndex)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-destructive transition-colors p-1"
                            title="Delete Color Variant"
                          >
                            <Trash className="h-5 w-5" />
                          </button>

                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Color Input */}
                            <div className="space-y-2">
                              <Label className="text-sm font-bold">Color Name</Label>
                              <Input 
                                {...form.register(`variants.${colorIndex}.color` as const)} 
                                placeholder="e.g. Yellow" 
                                className="h-10 bg-background"
                              />
                            </div>

                            {/* Images Upload */}
                            <div className="lg:col-span-2 space-y-2">
                              <Label className="text-sm font-bold">Color Images (Upload multiple)</Label>
                              <div className="flex flex-wrap gap-2 items-center">
                                {colorImages.map((imgUrl: string, imgIdx: number) => (
                                  <div key={imgIdx} className="relative h-16 w-16 rounded-lg overflow-hidden border bg-background group">
                                    <Image 
                                      src={imgUrl} 
                                      alt="" 
                                      fill 
                                      className="object-cover" 
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updatedImages = [...colorImages];
                                        updatedImages.splice(imgIdx, 1);
                                        form.setValue(`variants.${colorIndex}.images`, updatedImages);
                                      }}
                                      className="absolute top-0.5 right-0.5 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                                <ImageUpload 
                                  onUpload={(url) => {
                                    form.setValue(`variants.${colorIndex}.images`, [...colorImages, url]);
                                  }} 
                                  compact 
                                  className="h-16 w-16"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Sizes List under this color */}
                          <div className="space-y-4 pt-4 border-t border-muted/50">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Sizes & Pricing</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const currentSizes = form.getValues(`variants.${colorIndex}.sizes`) || [];
                                  form.setValue(`variants.${colorIndex}.sizes`, [
                                    ...currentSizes,
                                    { size: '', price: form.getValues('price') || '', stock: '', sku: '' }
                                  ]);
                                }}
                              >
                                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Size
                              </Button>
                            </div>

                            <div className="space-y-4">
                              {((form.watch(`variants.${colorIndex}.sizes`) as any[]) || []).map((sizeField, sizeIndex) => {
                                return (
                                  <div key={sizeIndex} className="border border-muted/40 rounded-lg p-4 bg-background relative space-y-4">
                                    {/* Delete size button */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const currentSizes = form.getValues(`variants.${colorIndex}.sizes`) || [];
                                        const updatedSizes = [...currentSizes];
                                        updatedSizes.splice(sizeIndex, 1);
                                        form.setValue(`variants.${colorIndex}.sizes`, updatedSizes);
                                      }}
                                      className="absolute top-2 right-2 text-muted-foreground hover:text-destructive transition-colors p-1"
                                      title="Remove Size"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>

                                    {/* 2 Row Layout */}
                                    {/* Row 1: Size, Price, Purchase Price, Stock, SKU */}
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2">
                                      <div>
                                        <Label className="text-xs font-medium text-muted-foreground">Size</Label>
                                        <Input
                                          {...form.register(`variants.${colorIndex}.sizes.${sizeIndex}.size` as const)}
                                          placeholder="e.g. XL"
                                          className="h-9 mt-1"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-xs font-medium text-muted-foreground">Price (USD)</Label>
                                        <Input
                                          type="number"
                                          value={form.watch(`variants.${colorIndex}.sizes.${sizeIndex}.price`) ?? ''}
                                          className="h-9 mt-1"
                                          onChange={(e) => {
                                            const val = e.target.value === '' ? '' : (parseFloat(e.target.value) || 0);
                                            form.setValue(`variants.${colorIndex}.sizes.${sizeIndex}.price`, val);
                                            const disc = form.getValues(`variants.${colorIndex}.sizes.${sizeIndex}.discountRate`) || 0;
                                            if (disc > 0 && val !== '') {
                                              form.setValue(`variants.${colorIndex}.sizes.${sizeIndex}.salePrice`, Math.round(val * (1 - disc / 100)));
                                            }
                                          }}
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-xs font-medium text-muted-foreground">Purchase (USD)</Label>
                                        <Input
                                          type="number"
                                          value={form.watch(`variants.${colorIndex}.sizes.${sizeIndex}.purchasePrice`) ?? ''}
                                          className="h-9 mt-1"
                                          onChange={(e) => {
                                            const val = e.target.value === '' ? '' : (parseFloat(e.target.value) || 0);
                                            form.setValue(`variants.${colorIndex}.sizes.${sizeIndex}.purchasePrice`, val);
                                          }}
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-xs font-medium text-muted-foreground">Stock</Label>
                                        <Input
                                          type="number"
                                          value={form.watch(`variants.${colorIndex}.sizes.${sizeIndex}.stock`) ?? ''}
                                          className="h-9 mt-1"
                                          onChange={(e) => {
                                            const val = e.target.value === '' ? '' : (parseInt(e.target.value) || 0);
                                            form.setValue(`variants.${colorIndex}.sizes.${sizeIndex}.stock`, val);
                                          }}
                                        />
                                      </div>
                                      <div className="col-span-2 md:col-span-1">
                                        <Label className="text-xs font-medium text-muted-foreground">SKU</Label>
                                        <Input
                                          {...form.register(`variants.${colorIndex}.sizes.${sizeIndex}.sku` as const)}
                                          placeholder="SKU"
                                          className="h-9 mt-1"
                                        />
                                      </div>
                                    </div>

                                    {/* Row 2: Discount Rate (%), Sale Price */}
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                      <div>
                                        <Label className="text-xs font-medium text-muted-foreground">Disc (%)</Label>
                                        <Input
                                          type="number"
                                          placeholder="0"
                                          value={form.watch(`variants.${colorIndex}.sizes.${sizeIndex}.discountRate`) ?? ''}
                                          className="h-9 mt-1"
                                          onChange={(e) => {
                                            const disc = e.target.value === '' ? undefined : (parseFloat(e.target.value) || 0);
                                            form.setValue(`variants.${colorIndex}.sizes.${sizeIndex}.discountRate`, disc);
                                            const prc = form.getValues(`variants.${colorIndex}.sizes.${sizeIndex}.price`) || 0;
                                            if (prc > 0 && disc !== undefined) {
                                              form.setValue(`variants.${colorIndex}.sizes.${sizeIndex}.salePrice`, Math.round(prc * (1 - disc / 100)));
                                            } else {
                                              form.setValue(`variants.${colorIndex}.sizes.${sizeIndex}.salePrice`, undefined);
                                            }
                                          }}
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-xs font-medium text-muted-foreground">Sale Price (USD)</Label>
                                        <Input
                                          type="number"
                                          placeholder="Optional"
                                          value={form.watch(`variants.${colorIndex}.sizes.${sizeIndex}.salePrice`) ?? ''}
                                          className="h-9 mt-1"
                                          onChange={(e) => {
                                            const sale = e.target.value === '' ? undefined : (parseFloat(e.target.value) || 0);
                                            form.setValue(`variants.${colorIndex}.sizes.${sizeIndex}.salePrice`, sale);
                                            const prc = form.getValues(`variants.${colorIndex}.sizes.${sizeIndex}.price`) || 0;
                                            if (prc > 0 && sale !== undefined && sale > 0 && sale < prc) {
                                              form.setValue(`variants.${colorIndex}.sizes.${sizeIndex}.discountRate`, Math.round((1 - sale / prc) * 100));
                                            } else {
                                              form.setValue(`variants.${colorIndex}.sizes.${sizeIndex}.discountRate`, undefined);
                                            }
                                          }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Regular Price (USD)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            {...field} 
                            value={field.value ?? ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? '' : (parseFloat(e.target.value) || 0);
                              field.onChange(value);
                              // Sync sale price if discount exists
                              const prc = value === '' ? 0 : value;
                              const discount = form.getValues('discountRate') || 0;
                              if (discount > 0 && prc > 0) {
                                const newSale = prc * (1 - discount / 100);
                                form.setValue('salePrice', Math.round(newSale));
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="purchasePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purchase Price (USD)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            {...field} 
                            value={field.value ?? ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? '' : (parseFloat(e.target.value) || 0);
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="discountRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0"
                            {...field} 
                            value={field.value || ''}
                            onChange={(e) => {
                              const discount = e.target.value === '' ? undefined : (parseFloat(e.target.value) || 0);
                              field.onChange(discount);
                              const price = form.getValues('price') || 0;
                              if (price > 0 && discount !== undefined) {
                                const newSale = price * (1 - discount / 100);
                                form.setValue('salePrice', Math.round(newSale));
                              } else {
                                form.setValue('salePrice', undefined);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="salePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sale Price (USD)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00"
                            {...field} 
                            value={field.value || ''}
                            onChange={(e) => {
                              const sale = parseFloat(e.target.value) || 0;
                              field.onChange(sale);
                              const price = form.getValues('price') || 0;
                              if (price > 0 && sale > 0 && sale < price) {
                                const newDiscount = Math.round((1 - sale / price) * 100);
                                form.setValue('discountRate', newDiscount);
                              } else {
                                form.setValue('discountRate', undefined);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="mt-6">
                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Stock Quantity</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field} 
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value === '' ? '' : (parseInt(e.target.value) || 0))}
                          />
                        </FormControl>
                        <FormDescription>Physical stock available for sale</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-bold">Product Category</Label>
                  <span className="text-[10px] text-destructive uppercase font-bold">Required</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {mainCategories.map((mainCat) => (
                    <Badge
                      key={mainCat._id}
                      variant={selectedCats.includes(mainCat._id) ? 'default' : 'outline'}
                      className="cursor-pointer py-1.5 px-4 text-sm"
                      onClick={() => toggleCategory(mainCat._id)}
                    >
                      {mainCat.name}
                    </Badge>
                  ))}
                </div>
                {!hasMainCategory && form.formState.isSubmitted && (
                  <p className="text-[0.8rem] font-medium text-destructive">
                    Select at least one product category
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-bold">Sub Category</Label>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Optional</span>
                </div>
                <div className="space-y-4 pt-2">
                  {selectedMainCategoryIds.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {categories
                        .filter((sub) => {
                          const parentId = sub.parentCategory?._id || sub.parentCategory;
                          return selectedMainCategoryIds.includes(parentId);
                        })
                        .map((subCat) => (
                          <Badge
                            key={subCat._id}
                            variant={selectedCats.includes(subCat._id) ? 'default' : 'outline'}
                            className="cursor-pointer py-1 px-3 text-xs"
                            onClick={() => toggleCategory(subCat._id)}
                          >
                            {subCat.name}
                          </Badge>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Select a product category to see available subcategories
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                    <Label htmlFor="featured">Featured Product</Label>
                    <input 
                        type="checkbox" 
                        id="featured"
                        {...form.register('isFeatured')} 
                        className="h-4 w-4 accent-primary cursor-pointer hover:scale-110 transition-transform" 
                    />
                </div>
                <div className="flex items-center justify-between">
                    <Label htmlFor="new-arrival">New Arrival</Label>
                    <input 
                        type="checkbox" 
                        id="new-arrival"
                        {...form.register('isNewArrival')} 
                        className="h-4 w-4 accent-primary cursor-pointer hover:scale-110 transition-transform" 
                    />
                </div>
                <div className="flex items-center justify-between">
                    <Label htmlFor="flash-sale">Flash Sale</Label>
                    <input 
                        type="checkbox" 
                        id="flash-sale"
                        {...form.register('isFlashSale')} 
                        className="h-4 w-4 accent-primary cursor-pointer hover:scale-110 transition-transform" 
                    />
                </div>
                <div className="flex items-center justify-between">
                    <Label htmlFor="published">Published</Label>
                    <input 
                        type="checkbox" 
                        id="published"
                        {...form.register('isPublished')} 
                        className="h-4 w-4" 
                    />
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
    </Form>
  );
}

