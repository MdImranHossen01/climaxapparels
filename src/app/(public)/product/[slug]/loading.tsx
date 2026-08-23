import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container px-4 md:px-0 mx-auto pt-8 pb-20 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mt-4">
        {/* Left Side: Images Skeleton */}
        <div className="space-y-4">
          <Skeleton className="w-full aspect-square md:aspect-[4/5] rounded-xl" />
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="w-20 h-20 md:w-24 md:h-24 rounded-lg shrink-0" />
            ))}
          </div>
        </div>

        {/* Right Side: Details Skeleton */}
        <div className="space-y-6 pt-4">
          <div className="space-y-3">
            <Skeleton className="w-24 h-4 rounded-full" />
            <Skeleton className="w-full h-10 md:h-12" />
            <Skeleton className="w-3/4 h-10 md:h-12" />
          </div>

          <div className="space-y-2 pt-2">
            <Skeleton className="w-32 h-8" />
            <div className="flex gap-2 mt-2">
               <Skeleton className="w-20 h-5" />
               <Skeleton className="w-20 h-5" />
            </div>
          </div>

          <Skeleton className="w-full h-[1px] my-6" />

          <div className="space-y-3">
            <Skeleton className="w-1/3 h-5 mb-2" />
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-5/6 h-4" />
            <Skeleton className="w-4/5 h-4" />
          </div>

          <div className="pt-6 space-y-4">
             <Skeleton className="w-1/4 h-6" />
             <div className="flex gap-3">
               {[1, 2, 3].map((i) => (
                 <Skeleton key={i} className="w-12 h-12 rounded-full" />
               ))}
             </div>
          </div>

          <div className="pt-8 flex gap-4">
            <Skeleton className="w-32 h-14 rounded-lg" />
            <Skeleton className="flex-1 h-14 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
