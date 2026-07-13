'use client'; 

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ShoppingCart, CheckCircle2, ShieldCheck, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function OrderForm({ content, settings }: { content: any; settings: any }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isPendingOrderBlocked, setIsPendingOrderBlocked] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    division: '',
    district: '',
    thana: '',
    quantity: content.defaultQuantity || 1,
  });

  useEffect(() => {
    if (!formData.phone || formData.phone.trim().length < 11) {
      setIsPendingOrderBlocked(false);
      return;
    }

    const checkPendingOrder = async () => {
      try {
        const res = await fetch(`/api/orders/check-pending?phone=${encodeURIComponent(formData.phone.trim())}`);
        if (res.ok) {
          const { hasPending } = await res.json();
          if (hasPending) {
            setIsPendingOrderBlocked(true);
            toast.error("আপনার একটি পেন্ডিং অর্ডার রয়েছে। সেটি কনফার্ম হওয়ার আগে নতুন অর্ডার করা যাবে না।");
          } else {
            setIsPendingOrderBlocked(false);
          }
        }
      } catch (err) {
        console.error("Error checking pending order:", err);
      }
    };

    checkPendingOrder();
  }, [formData.phone]);

  const isInsideDhaka = (district: string) => {
    const d = (district || '').toLowerCase().trim();
    return d.includes('dhaka') || d.includes('ঢাকা') || d === 'dhaka city' || d === 'old dhaka';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic presence check
    if (!formData.name || !formData.phone || !formData.address) {
      toast.error('অনুগ্রহ করে সব তথ্য প্রদান করুন');
      return;
    }

    // Phone regex validation
    const phoneRegex = /^(?:\+88|88)?(01[3-9]\d{8})$/;
    if (!phoneRegex.test(formData.phone.replace(/\s|-/g, ''))) {
      toast.error('সঠিক মোবাইল নাম্বার প্রদান করুন (যেমন: 017XXXXXXXX)');
      return;
    }

    // Product ID validation
    if (!content.productId) {
      toast.error('দুঃখিত, এই পণ্যের অর্ডার বর্তমানে বন্ধ আছে। (Missing Product ID)');
      return;
    }

    setLoading(true);
    try {
      const insideDhaka = isInsideDhaka(formData.district);
      
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerInfo: {
            name: formData.name,
            email: formData.email.trim() || null, 
            phone: formData.phone,
            address: formData.address,
            division: formData.division,
            district: formData.district,
            thana: formData.thana,
          },
          items: [
            {
              productId: content.productId,
              name: content.productName || 'Landing Page Product',
              price: content.price || 0,
              quantity: formData.quantity,
              image: content.productImage || '',
            }
          ],
          paymentMethod: 'cod',
          shippingMethod: insideDhaka ? 'inside' : 'outside',
          totalAmount: (content.price || 0) * formData.quantity + (insideDhaka ? (settings.deliveryChargeInsideDhaka || 60) : (settings.deliveryChargeOutsideDhaka || 120)),
          status: 'pending'
        }),
      });

      if (res.ok) {
        setSuccess(true);
        toast.success('অর্ডারটি সফলভাবে সম্পন্ন হয়েছে!');
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || 'অর্ডার ব্যর্থ হয়েছে');
      }
    } catch (error: any) {
      toast.error(error.message || 'দুঃখিত, অর্ডারটি সম্পন্ন করা সম্ভব হয়নি। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container mx-auto px-4 max-w-xl text-center py-20 space-y-6">
        <div className="inline-flex h-20 w-20 items-center justify-center bg-emerald-100 text-emerald-600 rounded-full animate-bounce">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h2 className="text-3xl font-black tracking-tight">অর্ডারটি সফল হয়েছে!</h2>
        <p className="text-muted-foreground">খুব শীঘ্রই আমাদের প্রতিনিধি আপনার সাথে ফোনে যোগাযোগ করবেন। আমাদের সাথে থাকার জন্য ধন্যবাদ।</p>
        <Button onClick={() => setSuccess(false)} variant="outline" className="rounded-full">নতুন অর্ডার করুন</Button>
      </div>
    );
  }

  return (
    <div id="order" className="container mx-auto px-4 max-w-2xl py-10">
      <div className="bg-white border-4 border-primary/20 rounded-[2rem] shadow-2xl overflow-hidden">
        <div className="bg-primary p-6 text-white text-center">
          <h2 className="text-xl md:text-2xl font-black">{content.title}</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-bold">আপনার নাম</Label>
              <Input 
                placeholder="নাম লিখুন"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="h-12 rounded-xl border-2 focus:border-primary transition-all"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold">আপনার মোবাইল নাম্বার</Label>
                <Input 
                  placeholder="০১৭XXXXXXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="h-12 rounded-xl border-2 focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">ইমেইল (ঐচ্ছিক)</Label>
                <Input 
                  type="email"
                  placeholder="example@mail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="h-12 rounded-xl border-2 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-bold">জেলা (District)</Label>
              <Input 
                placeholder="যেমন: ঢাকা"
                value={formData.district}
                onChange={(e) => setFormData({...formData, district: e.target.value})}
                className="h-12 rounded-xl border-2 focus:border-primary transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-bold">বিস্তারিত ঠিকানা</Label>
              <Textarea 
                placeholder="গ্রাম/রোড, থানা"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="rounded-xl border-2 focus:border-primary transition-all"
              />
            </div>

            {content.showQuantity && (
              <div className="space-y-2">
                <Label className="font-bold">পরিমাণ (Quantity)</Label>
                <div className="flex items-center gap-4">
                   <button 
                     type="button"
                     onClick={() => setFormData({...formData, quantity: Math.max(1, formData.quantity - 1)})}
                     className="h-10 w-10 rounded-lg border-2 flex items-center justify-center font-bold hover:bg-gray-50"
                   >-</button>
                   <span className="text-xl font-black">{formData.quantity}</span>
                   <button 
                     type="button"
                     onClick={() => setFormData({...formData, quantity: formData.quantity + 1})}
                     className="h-10 w-10 rounded-lg border-2 flex items-center justify-center font-bold hover:bg-gray-50"
                   >+</button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-emerald-50 border-2 border-emerald-100 p-4 rounded-2xl flex items-start gap-3">
             <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0" />
             <div className="text-sm text-emerald-800">
                <strong>নিরাপদ পেমেন্ট:</strong> {content.paymentInstructions}
             </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading || isPendingOrderBlocked}
            className="w-full h-14 rounded-2xl font-black text-xl gap-3 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
          >
            {loading ? 'প্রসেসিং হচ্ছে...' : isPendingOrderBlocked ? 'পেন্ডিং অর্ডার রয়েছে' : <><ShoppingCart className="h-6 w-6" /> {content.buttonText}</>}
          </Button>

          <div className="flex items-center justify-center gap-6 text-[10px] uppercase font-bold opacity-50 tracking-widest">
             <div className="flex items-center gap-1"><Truck className="h-3 w-3" /> Fast Delivery</div>
             <div className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Verified Quality</div>
          </div>
        </form>
      </div>
    </div>
  );
}
