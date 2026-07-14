'use client';

import { useState, useEffect } from 'react';
import {
  Building2, Award, Mail, Phone, MapPin, ChevronRight,
  Globe, CheckCircle2, Send, ExternalLink, Package, Truck, Layers2
} from 'lucide-react';
import Swal from 'sweetalert2';
import dynamic from 'next/dynamic';

const NovelEditor = dynamic(() => import('@/components/editor/NovelEditor'), {
  ssr: false,
  loading: () => <div className="h-20 rounded-xl bg-muted/30 animate-pulse" />,
});

interface CatalogItem { name: string; image: string; }
interface CatalogCategory { id: string; name: string; description: string; items: CatalogItem[]; }
interface CompanyInfo {
  about: string; capacity: string; established: string;
  certifications: string; markets: string; address: string;
  phone: string; email: string; corporatePresence: string;
}
interface CatalogData { companyInfo: CompanyInfo; categories: CatalogCategory[]; }

export default function CatalogPage() {
  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [activeTab, setActiveTab] = useState('');
  const [settings, setSettings] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', company: '', category: '', quantity: '300', message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/catalog')
      .then(res => res.json())
      .then((data: CatalogData) => {
        setCatalog(data);
        if (data.categories?.length > 0) {
          setActiveTab(data.categories[0].id);
          setFormData(f => ({ ...f, category: data.categories[0].name }));
        }
      })
      .catch(err => console.error('Failed to load catalog:', err));

    fetch('/api/settings')
      .then(res => res.json())
      .then(d => setSettings(d))
      .catch(() => {});
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      Swal.fire({ title: 'Error!', text: 'Please fill in Name, Email and Phone.', icon: 'error', confirmButtonText: 'OK' });
      return;
    }
    setSubmitting(true);
    try {
      const phone = catalog?.companyInfo?.phone || '+8801724338581';
      const cleanNum = phone.replace(/[^0-9]/g, '');
      const msg = `*B2B Inquiry from Climax Catalog:*\nName: ${formData.name}\nCompany: ${formData.company || 'N/A'}\nEmail: ${formData.email}\nPhone: ${formData.phone}\nCategory: ${formData.category}\nQty: ${formData.quantity} pcs\nMessage: ${formData.message}`;
      const waUrl = `https://wa.me/${cleanNum}?text=${encodeURIComponent(msg)}`;

      await Swal.fire({
        title: 'Inquiry Prepared!',
        text: 'Redirecting you to our factory WhatsApp representative.',
        icon: 'success',
        confirmButtonText: 'Open WhatsApp',
      });
      window.open(waUrl, '_blank');
      setFormData({ name: '', email: '', phone: '', company: '', category: catalog?.categories?.[0]?.name || '', quantity: '300', message: '' });
    } finally {
      setSubmitting(false);
    }
  };

  const companyInfo = catalog?.companyInfo;
  const categories = catalog?.categories || [];
  const currentCategory = categories.find(c => c.id === activeTab);

  if (!catalog) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 pb-20">
      {/* Hero Banner */}
      <div className="relative bg-primary py-24 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, white 0%, transparent 60%)' }} />
        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl space-y-6">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] bg-white/10 px-4 py-2 rounded-full border border-white/20">
            Official B2B Showcase
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
            Underwear Manufacturer<br />Product Catalog
          </h1>
          <p className="text-lg text-white/80 font-medium max-w-2xl mx-auto">
            Leading underwear manufacturer based in Bangladesh, specializing in premium boxers, briefs, trunks, and swim shorts.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <a href="#quote" className="bg-white text-primary font-black px-8 py-3 rounded-full hover:bg-neutral-100 transition-all shadow-lg text-sm">
              Get Custom Quote
            </a>
            <a href={`https://wa.me/${(companyInfo?.phone || '+8801724338581').replace(/[^0-9]/g, '')}`}
              target="_blank" rel="noopener noreferrer"
              className="border border-white/40 hover:bg-white/10 font-bold px-8 py-3 rounded-full transition-all text-sm flex items-center gap-2">
              Contact Bangladesh Factory <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="container mx-auto px-4 max-w-6xl -mt-10 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Production Capacity', val: companyInfo?.capacity || '—', icon: Layers2 },
            { label: 'Establishment Year', val: companyInfo?.established || '—', icon: Building2 },
            { label: 'B2B Certificates', val: companyInfo?.certifications || '—', icon: Award },
            { label: 'Primary Markets', val: companyInfo?.markets || '—', icon: Globe },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 p-6 rounded-[2rem] shadow-xl flex flex-col items-center text-center space-y-2">
              <div className="h-10 w-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <stat.icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">{stat.label}</span>
              <span className="text-base font-extrabold text-slate-800 dark:text-zinc-100">{stat.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Company Overview */}
      <div className="container mx-auto px-4 max-w-6xl py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-slate-200/60 dark:border-zinc-800 shadow-xl space-y-6">
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">About Climax Apparels</h2>
            <p className="text-slate-600 dark:text-zinc-400 leading-relaxed font-medium whitespace-pre-line">
              {companyInfo?.about}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
              {[
                { title: 'Fabric Customization', desc: 'Cotton, modal, spandex, and premium bamboo blends.' },
                { title: 'Private Labeling', desc: 'Branded elastic waistbands, custom hangtags & packaging.' },
                { title: 'Fast Lead Times', desc: 'Typical B2B production within 25–40 days based on size.' },
                { title: 'Low B2B MOQ', desc: 'Small initial batch order starting from 300 pieces per style.' },
              ].map((f, idx) => (
                <div key={idx} className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-100">{f.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-slate-200/60 dark:border-zinc-800 shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><Package className="h-4 w-4" /></div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-zinc-100">Packaging Styles</h3>
              </div>
              <ul className="space-y-2 text-xs font-semibold text-slate-600 dark:text-zinc-400">
                {['Standard Polybag Packaging', 'Branded Box / Hangtag (OEM)', 'Eco-friendly Packaging Options'].map(p => (
                  <li key={p} className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-primary" />{p}</li>
                ))}
              </ul>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-slate-200/60 dark:border-zinc-800 shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><Truck className="h-4 w-4" /></div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-zinc-100">Logistics & Shipping</h3>
              </div>
              <ul className="space-y-2 text-xs font-semibold text-slate-600 dark:text-zinc-400">
                {['Worldwide Shipping (Sea & Air)', 'Terms: T/T, LC, Cash (Negotiable)', 'Lead Time: 25-40 business days'].map(p => (
                  <li key={p} className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-primary" />{p}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Factory Info Card */}
        <div className="lg:col-span-5">
          <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl space-y-6 border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-40 w-40 bg-primary/10 rounded-full blur-2xl" />
            <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> Bangladesh Factory Address
            </h3>
            <div className="space-y-4 text-sm text-neutral-300">
              {[
                { icon: MapPin, label: 'Factory Location', val: companyInfo?.address },
                { icon: Phone, label: 'Phone / WhatsApp', val: companyInfo?.phone },
                { icon: Mail, label: 'E-mail Address', val: companyInfo?.email },
                { icon: Globe, label: 'Corporate Presence', val: companyInfo?.corporatePresence },
              ].map(({ icon: Icon, label, val }) => (
                <div key={label} className="flex gap-3">
                  <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider opacity-60">{label}</h4>
                    <p className="font-medium">{val}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400 font-bold">
              <span>Production Capacity</span>
              <span className="text-white bg-primary px-3 py-1 rounded-full text-[10px]">{companyInfo?.capacity}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Catalog */}
      {categories.length > 0 && (
        <div className="bg-slate-100/60 dark:bg-zinc-900/40 border-y border-slate-200/50 dark:border-zinc-800/60 py-20">
          <div className="container mx-auto px-4 max-w-6xl space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">Explore Our Product Ranges</h2>
              <p className="text-sm text-muted-foreground font-medium">
                We manufacture underwear and swim shorts under OEM license models for global brands.
              </p>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-2.5 rounded-full font-black text-xs transition-all ${activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-white dark:bg-zinc-900 hover:bg-slate-50 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800'}`}>
                  {tab.name}
                </button>
              ))}
            </div>

            {/* Description */}
            {(() => {
              const desc = currentCategory?.description;
              if (!desc) return null;
              
              // If it's a JSON string, verify it has content
              try {
                const parsed = JSON.parse(desc);
                // Check if it's a standard Novel/Tiptap empty doc
                if (parsed.type === 'doc' && (!parsed.content || parsed.content.length === 0)) return null;
                // If it contains a single empty paragraph
                if (
                  parsed.type === 'doc' &&
                  parsed.content?.length === 1 &&
                  parsed.content[0].type === 'paragraph' &&
                  (!parsed.content[0].content || parsed.content[0].content.length === 0)
                ) {
                  return null;
                }
              } catch (e) {
                // If it's plain text, check if it's empty
                if (!desc.trim()) return null;
              }

              return (
                <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 px-8 py-6 rounded-[1.5rem] shadow-sm max-w-2xl mx-auto space-y-3">
                  <h3 className="font-extrabold text-sm text-primary uppercase tracking-wider text-center">Category Specifications</h3>
                  <div className="prose prose-sm dark:prose-invert max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_p]:my-1">
                    <NovelEditor
                      initialValue={(() => {
                        try { return JSON.parse(desc); } catch { return undefined; }
                      })()}
                      onChange={() => {}}
                      readOnly
                    />
                  </div>
                </div>
              );
            })()}

            {/* Products Grid */}
            {currentCategory && currentCategory.items.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {currentCategory.items.map((item, idx) => (
                  <div key={idx} className="bg-white dark:bg-zinc-900 rounded-[2rem] overflow-hidden border border-slate-200/60 dark:border-zinc-800 shadow-lg group hover:-translate-y-1 transition-all">
                    <div className="relative h-60 w-full bg-slate-100 dark:bg-zinc-800 overflow-hidden border-b">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">No image</div>
                      )}
                      <div className="absolute bottom-3 left-3 bg-black/70 text-white font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded">
                        MOQ: 300 Pcs
                      </div>
                    </div>
                    <div className="p-5 space-y-2">
                      <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-100 min-h-[2.5rem] line-clamp-2">{item.name}</h4>
                      <div className="flex items-center justify-between text-[10px] font-black uppercase text-primary tracking-wide">
                        <span>OEM / Custom</span>
                        <span className="flex items-center gap-1 opacity-70">Standard Sizes <ChevronRight className="h-3 w-3" /></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">No products in this category.</div>
            )}
          </div>
        </div>
      )}

      {/* Quotation Form */}
      <div id="quote" className="container mx-auto px-4 max-w-3xl py-24">
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-slate-200/60 dark:border-zinc-800 shadow-2xl p-8 md:p-12 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Request Factory Quotation</h2>
            <p className="text-sm text-muted-foreground font-medium">Fill in the form to get a personalized B2B quotation directly from our Bangladesh factory.</p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { name: 'name', label: 'Your Name *', type: 'text', placeholder: 'John Doe', required: true },
                { name: 'email', label: 'Company Email *', type: 'email', placeholder: 'john@company.com', required: true },
                { name: 'phone', label: 'Phone / WhatsApp *', type: 'tel', placeholder: '+1 234 567 890', required: true },
                { name: 'company', label: 'Company Name', type: 'text', placeholder: 'Global Apparel Ltd', required: false },
              ].map(field => (
                <div key={field.name} className="space-y-2">
                  <label className="text-xs font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider">{field.label}</label>
                  <input type={field.type} name={field.name} value={(formData as any)[field.name]}
                    onChange={handleInputChange} placeholder={field.placeholder} required={field.required}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white" />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider">Target Brand / Category</label>
                <select name="category" value={formData.category} onChange={handleInputChange}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white">
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider">Est. Order Quantity (MOQ: 300)</label>
                <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange}
                  min="300" placeholder="300" required
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider">Specification Details / Custom Message</label>
              <textarea name="message" value={formData.message} onChange={handleInputChange} rows={4}
                placeholder="List fabric weight, waistband branding details, packaging styles, etc."
                className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white" />
            </div>

            <button type="submit" disabled={submitting}
              className="w-full h-14 bg-primary text-white font-black rounded-xl hover:bg-primary/95 transition-all shadow-xl active:scale-[0.99] flex items-center justify-center gap-2">
              {submitting ? 'Submitting...' : <><Send className="h-4 w-4" />Submit Quotation Request</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
