import React from 'react';
import { ShieldAlert, MessageCircle, Globe } from 'lucide-react';

interface SubscriptionBlockerProps {
  brandName: string;
  expiryDate?: Date;
}

export default function SubscriptionBlocker({ brandName, expiryDate }: SubscriptionBlockerProps) {
  return (
    <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center p-4 text-center">
      <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="relative">
          <div className="absolute inset-0 bg-red-100 rounded-full scale-150 blur-2xl opacity-50" />
          <div className="relative h-24 w-24 bg-red-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-red-600/30 rotate-6">
            <ShieldAlert className="h-12 w-12 text-white" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">Access Restricted</h1>
          <p className="text-slate-500 font-medium">
            The subscription for <span className="text-red-600 font-bold">{brandName}</span> has expired or been suspended.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl space-y-4">
          <div className="text-xs font-black uppercase tracking-widest text-slate-400">Next Steps</div>
          <p className="text-sm text-slate-600">
            To restore access to your storefront and dashboard, please contact the platform administrator to renew your subscription.
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-green-600 font-bold">
              <MessageCircle className="h-4 w-4" /> WhatsApp: +8801919011101
            </div>
            <div className="flex items-center justify-center gap-2 text-blue-600 font-bold">
              <Globe className="h-4 w-4" /> Visit: www.jiapixel.com
            </div>
          </div>
        </div>

        <div className="pt-4">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
            Infrastructure Powered by Climax Apparels SaaS Platform
          </p>
        </div>
      </div>
    </div>
  );
}

