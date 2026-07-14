'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  Building2, Save, Plus, Trash2, Edit3, ChevronDown, ChevronUp,
  Image as ImageIcon, Package, Globe, Phone, Mail, MapPin, X, GripVertical, Check
} from 'lucide-react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import type { JSONContent } from 'novel';

const NovelEditor = dynamic(() => import('@/components/editor/NovelEditor'), {
  ssr: false,
  loading: () => <div className="h-[200px] rounded-lg border bg-muted/30 animate-pulse" />,
});

interface CatalogItem {
  name: string;
  image: string;
}

interface CatalogCategory {
  id: string;
  name: string;
  description: string;
  items: CatalogItem[];
}

interface CompanyInfo {
  about: string;
  capacity: string;
  established: string;
  certifications: string;
  markets: string;
  address: string;
  phone: string;
  email: string;
  corporatePresence: string;
}

export default function AdminCatalogPage() {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    about: '',
    capacity: '',
    established: '',
    certifications: '',
    markets: '',
    address: '',
    phone: '',
    email: '',
    corporatePresence: '',
  });

  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // New category form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [showNewCatForm, setShowNewCatForm] = useState(false);

  // New item form state per category
  const [newItemName, setNewItemName] = useState<Record<string, string>>({});
  const [newItemImage, setNewItemImage] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/catalog')
      .then(res => res.json())
      .then(data => {
        setCompanyInfo(data.companyInfo || {});
        setCategories(data.categories || []);
      })
      .catch(() => toast.error('Failed to load catalog data'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyInfo, categories }),
      });

      if (!res.ok) throw new Error('Save failed');
      toast.success('Catalog saved successfully!');
    } catch (err) {
      toast.error('Failed to save catalog.');
    } finally {
      setSaving(false);
    }
  };

  const handleCompanyChange = (field: keyof CompanyInfo, value: string) => {
    setCompanyInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) {
      toast.error('Category name is required.');
      return;
    }
    const id = newCatName.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
    setCategories(prev => [...prev, { id, name: newCatName.trim(), description: newCatDesc.trim(), items: [] }]);
    setNewCatName('');
    setNewCatDesc('');
    setShowNewCatForm(false);
    setExpandedCategory(id);
    toast.success('Category added.');
  };

  const handleDeleteCategory = async (catId: string) => {
    const result = await Swal.fire({
      title: 'Delete Category?',
      text: 'This will remove the category and all its product items.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      customClass: { popup: 'rounded-[2rem]' },
    });
    if (result.isConfirmed) {
      setCategories(prev => prev.filter(c => c.id !== catId));
      toast.info('Category removed.');
    }
  };

  const handleUpdateCategoryField = (catId: string, field: 'name' | 'description', value: string) => {
    setCategories(prev => prev.map(c => c.id === catId ? { ...c, [field]: value } : c));
  };

  const handleAddItem = (catId: string) => {
    const name = (newItemName[catId] || '').trim();
    const image = (newItemImage[catId] || '').trim();
    if (!name) {
      toast.error('Product name is required.');
      return;
    }
    setCategories(prev => prev.map(c => c.id === catId
      ? { ...c, items: [...c.items, { name, image }] }
      : c
    ));
    setNewItemName(prev => ({ ...prev, [catId]: '' }));
    setNewItemImage(prev => ({ ...prev, [catId]: '' }));
    toast.success('Product added.');
  };

  const handleDeleteItem = (catId: string, itemIdx: number) => {
    setCategories(prev => prev.map(c => c.id === catId
      ? { ...c, items: c.items.filter((_, i) => i !== itemIdx) }
      : c
    ));
    toast.info('Product removed.');
  };

  const handleUpdateItem = (catId: string, itemIdx: number, field: 'name' | 'image', value: string) => {
    setCategories(prev => prev.map(c => {
      if (c.id !== catId) return c;
      const updatedItems = c.items.map((item, i) => i === itemIdx ? { ...item, [field]: value } : item);
      return { ...c, items: updatedItems };
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Catalog Manager</h1>
          <p className="text-sm text-muted-foreground">Manage the public-facing B2B product catalog page.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-white font-bold px-6 py-2.5 rounded-xl shadow hover:bg-primary/90 transition-all disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      {/* Company Info Panel */}
      <div className="bg-card border rounded-2xl p-6 space-y-6">
        <h2 className="text-lg font-extrabold flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Company / Factory Info
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'capacity', label: 'Production Capacity', placeholder: '5,00,000 pcs/m' },
            { key: 'established', label: 'Established Year', placeholder: 'Since 2014' },
            { key: 'certifications', label: 'Certifications', placeholder: 'ISO, BSCI Certified' },
            { key: 'markets', label: 'Primary Markets', placeholder: 'EU, USA, Mid-East' },
            { key: 'phone', label: 'Phone / WhatsApp', placeholder: '+880 1724-338581' },
            { key: 'email', label: 'Factory Email', placeholder: 'info@climaxapparels.com' },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">{label}</label>
              <input
                type="text"
                value={(companyInfo as any)[key] || ''}
                onChange={e => handleCompanyChange(key as keyof CompanyInfo, e.target.value)}
                placeholder={placeholder}
                className="w-full h-10 px-4 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Factory Address</label>
          <input
            type="text"
            value={companyInfo.address || ''}
            onChange={e => handleCompanyChange('address', e.target.value)}
            placeholder="Sarkarbari, Helal Market, Uttar Khan, Dhaka"
            className="w-full h-10 px-4 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Corporate Presence</label>
          <input
            type="text"
            value={companyInfo.corporatePresence || ''}
            onChange={e => handleCompanyChange('corporatePresence', e.target.value)}
            placeholder="LinkedIn / Alibaba / Google Business Profile"
            className="w-full h-10 px-4 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">About / Company Description</label>
          <textarea
            rows={4}
            value={companyInfo.about || ''}
            onChange={e => handleCompanyChange('about', e.target.value)}
            placeholder="Write a brief description of the factory..."
            className="w-full p-4 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>
      </div>

      {/* Categories Panel */}
      <div className="bg-card border rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Brand Categories & Products
          </h2>
          <button
            onClick={() => setShowNewCatForm(v => !v)}
            className="flex items-center gap-2 text-xs font-black bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 rounded-lg transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </button>
        </div>

        {/* Add Category Form */}
        {showNewCatForm && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold">New Brand Category</h3>
            <input
              type="text"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              placeholder="Brand Name (e.g. Armani)"
              className="w-full h-10 px-4 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Specifications (bullet points, headings, etc.)</label>
              <NovelEditor
                onChange={(val) => setNewCatDesc(val)}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddCategory}
                className="flex items-center gap-1 bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg"
              >
                <Check className="h-3.5 w-3.5" /> Add
              </button>
              <button
                onClick={() => setShowNewCatForm(false)}
                className="flex items-center gap-1 bg-muted text-muted-foreground text-xs font-bold px-4 py-2 rounded-lg"
              >
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
            </div>
          </div>
        )}

        {/* Category Accordion List */}
        <div className="space-y-3">
          {categories.map((cat, catIdx) => (
            <div key={cat.id} className="border rounded-xl overflow-hidden">
              {/* Category Header */}
              <div className="flex items-center justify-between p-4 bg-muted/40 cursor-pointer"
                onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded">
                    {cat.items.length} items
                  </span>
                  <span className="font-bold text-sm">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={e => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                    className="p-1.5 rounded hover:bg-red-100 text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  {expandedCategory === cat.id
                    ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  }
                </div>
              </div>

              {/* Category Body (Expanded) */}
              {expandedCategory === cat.id && (
                <div className="p-5 space-y-5 border-t">
                  {/* Edit name & description */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Category Name</label>
                      <input
                        type="text"
                        value={cat.name}
                        onChange={e => handleUpdateCategoryField(cat.id, 'name', e.target.value)}
                        className="w-full h-10 px-4 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Specifications (use / for bullet points, bold, headings)</label>
                      <NovelEditor
                        initialValue={(() => {
                          try { return JSON.parse(cat.description); } catch { return undefined; }
                        })()}
                        onChange={(val) => handleUpdateCategoryField(cat.id, 'description', val)}
                      />
                    </div>
                  </div>

                  {/* Product Items */}
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3">Product Items</h4>
                    <div className="space-y-2">
                      {cat.items.map((item, itemIdx) => (
                        <div key={itemIdx} className="flex items-center gap-3 bg-muted/30 p-2.5 rounded-lg">
                          {item.image && (
                            <img src={item.image} alt={item.name} className="h-10 w-10 object-cover rounded-lg shrink-0 border" />
                          )}
                          <input
                            type="text"
                            value={item.name}
                            onChange={e => handleUpdateItem(cat.id, itemIdx, 'name', e.target.value)}
                            className="flex-1 min-w-0 h-9 px-3 rounded-lg border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="Product name"
                          />
                          <input
                            type="text"
                            value={item.image}
                            onChange={e => handleUpdateItem(cat.id, itemIdx, 'image', e.target.value)}
                            className="flex-1 min-w-0 h-9 px-3 rounded-lg border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="Image URL"
                          />
                          <button
                            onClick={() => handleDeleteItem(cat.id, itemIdx)}
                            className="p-1.5 rounded hover:bg-red-100 text-red-500 transition-colors shrink-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add new item */}
                    <div className="flex items-center gap-2 mt-3">
                      <input
                        type="text"
                        value={newItemName[cat.id] || ''}
                        onChange={e => setNewItemName(prev => ({ ...prev, [cat.id]: e.target.value }))}
                        placeholder="New product name"
                        className="flex-1 min-w-0 h-9 px-3 rounded-lg border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <input
                        type="text"
                        value={newItemImage[cat.id] || ''}
                        onChange={e => setNewItemImage(prev => ({ ...prev, [cat.id]: e.target.value }))}
                        placeholder="Image URL"
                        className="flex-1 min-w-0 h-9 px-3 rounded-lg border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <button
                        onClick={() => handleAddItem(cat.id)}
                        className="shrink-0 flex items-center gap-1 bg-primary text-white text-xs font-bold px-3 py-2 rounded-lg"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {categories.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No categories yet. Click "Add Category" to get started.
            </div>
          )}
        </div>
      </div>

      {/* Bottom Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-white font-bold px-8 py-3 rounded-xl shadow hover:bg-primary/90 transition-all disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}
