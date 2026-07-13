import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function BlogFeaturedSkeleton() {
  return (
    <div className="group mb-10 grid md:grid-cols-2 overflow-hidden rounded-[2rem] border bg-card h-[400px]">
      <Skeleton className="h-full w-full rounded-none" />
      <div className="p-8 md:p-10 flex flex-col justify-center space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-3/4" />
        <div className="space-y-2 pt-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Skeleton className="h-6 w-32 pt-4" />
      </div>
    </div>
  );
}

export function BlogCardSkeleton() {
  return (
    <div className="flex flex-col bg-card border rounded-[2rem] overflow-hidden border-border/50">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="p-8 flex flex-col flex-1 space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-7 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <div className="pt-4 border-t border-border/50 flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border bg-background">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="flex flex-1 flex-col p-4 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ShopHeaderSkeleton() {
  return (
    <div className="mb-10 rounded-3xl border bg-gradient-to-r from-primary/[0.08] via-background to-background p-6 md:p-10">
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="h-12 w-full md:w-3/4" />
        <Skeleton className="h-12 w-1/2 md:w-2/3" />
        <Skeleton className="h-6 w-full md:w-1/2" />
      </div>
    </div>
  );
}

export function SectionSkeleton() {
  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col space-y-4 mb-10">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <ProductCardSkeleton />
          <ProductCardSkeleton />
          <ProductCardSkeleton />
          <ProductCardSkeleton />
        </div>
      </div>
    </section>
  );
}

export function CategoryShowcaseSkeleton() {
  return (
    <section className="bg-muted/30 py-12">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col items-center space-y-4 mb-10 text-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex justify-center gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <Skeleton className="h-20 w-20 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BannerSkeleton() {
  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <Skeleton className="h-[300px] w-full rounded-2xl" />
      </div>
    </section>
  );
}

export function BlogRecentSkeleton() {
  return (
    <section className="py-12 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center md:items-end justify-between mb-12 gap-6">
          <div className="space-y-4">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
        <BlogFeaturedSkeleton />
      </div>
    </section>
  );
}

export function FeaturesSectionSkeleton() {
  return (
    <section className="py-12 border-y bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <Skeleton className="h-6 w-32 mx-auto rounded-full" />
          <Skeleton className="h-12 w-96 mx-auto" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center p-6 space-y-4">
              <Skeleton className="h-14 w-14 rounded-2xl" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FAQSectionSkeleton() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <Skeleton className="h-6 w-32 mx-auto rounded-full" />
          <Skeleton className="h-12 w-96 mx-auto" />
        </div>
        <div className="max-w-3xl mx-auto space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </section>
  );
}

export function TestimonialsSkeleton() {
  return (
    <section className="py-20 bg-muted/10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <Skeleton className="h-6 w-32 mx-auto rounded-full" />
          <Skeleton className="h-12 w-96 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-3xl" />
          ))}
        </div>
      </div>
    </section>
  );
}

