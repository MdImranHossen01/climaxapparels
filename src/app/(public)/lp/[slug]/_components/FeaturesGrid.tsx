'use client'; 

import { 
  Leaf, 
  Truck, 
  ShieldCheck, 
  Zap, 
  Heart, 
  Award,
  Bus,
  Package,
  Clock,
  Phone,
  MapPin,
  CreditCard,
  Gift,
  ThumbsUp,
  Star,
  Sparkles,
  Percent,
  Smile,
  Check,
  Users,
  MessageSquare,
  RefreshCw
} from 'lucide-react';

const ICONS: any = {
  leaf: Leaf,
  truck: Truck,
  'shield-check': ShieldCheck,
  zap: Zap,
  heart: Heart,
  award: Award,
  bus: Bus,
  package: Package,
  clock: Clock,
  phone: Phone,
  'map-pin': MapPin,
  'credit-card': CreditCard,
  gift: Gift,
  'thumbs-up': ThumbsUp,
  star: Star,
  sparkles: Sparkles,
  percent: Percent,
  smile: Smile,
  check: Check,
  users: Users,
  'message-square': MessageSquare,
  'refresh-cw': RefreshCw
};

export default function FeaturesGrid({ content }: { content: any }) {
  return (
    <div className="container mx-auto px-4 text-center">
      <h2 className="text-3xl md:text-4xl font-black mb-12 tracking-tight">{content.title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {(content.items || []).map((item: any) => {
          const Icon = ICONS[item.icon] || ShieldCheck;
          return (
            <div key={`${item.title}-${item.icon}`} className="p-8 rounded-[2rem] bg-white border-2 border-gray-100 hover:border-primary/20 hover:shadow-2xl transition-all space-y-4">
              <div className="h-16 w-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto">
                <Icon className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
