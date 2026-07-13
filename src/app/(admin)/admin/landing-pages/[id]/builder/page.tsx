'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { 
  restrictToVerticalAxis, 
  restrictToWindowEdges 
} from '@dnd-kit/modifiers';
import { 
  Save, 
  Eye, 
  Plus, 
  Trash2, 
  Settings, 
  GripVertical, 
  ChevronLeft,
  Smartphone,
  Monitor as MonitorIcon,
  Laptop
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { SECTION_TEMPLATES, SectionType } from '@/lib/landing-page-sections';
import { v4 as uuidv4 } from 'uuid';

// Sub-components (defined in the same file or separate)
import SortableSectionItem from './_components/SortableSectionItem';
import SectionSettingsEditor from './_components/SectionSettingsEditor';

export default function LandingPageBuilder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [pageData, setPageData] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchPageData();
  }, [id]);

  const fetchPageData = async () => {
    try {
      const res = await fetch(`/api/admin/landing-pages/${id}`);
      if (!res.ok) throw new Error('Failed to load page');
      const data = await res.json();
      setPageData(data);
      setSections(data.sections || []);
    } catch (error) {
      toast.error('Could not load landing page data');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
    
    setActiveId(null);
  };

  const addSection = (template: any) => {
    const newSection = {
      id: uuidv4(),
      type: template.type,
      content: JSON.parse(JSON.stringify(template.defaultContent)),
      styles: { paddingTop: 'py-12', paddingBottom: 'py-12' }
    };
    setSections([...sections, newSection]);
    setSelectedSectionId(newSection.id);
    toast.success(`${template.label} added!`);
  };

  const deleteSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
    if (selectedSectionId === id) setSelectedSectionId(null);
    toast.info('Section removed');
  };

  const updateSectionContent = (id: string, newContent: any) => {
    setSections(sections.map(s => s.id === id ? { ...s, content: newContent } : s));
  };

  const updateSectionStyles = (id: string, newStyles: any) => {
    setSections(sections.map(s => s.id === id ? { ...s, styles: newStyles } : s));
  };

  const savePage = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/landing-pages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections })
      });
      
      if (res.ok) {
        toast.success('Landing Page Saved Successfully!');
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center">Loading Builder...</div>;

  const selectedSection = sections.find(s => s.id === selectedSectionId);

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Top Header */}
      <header className="h-16 border-b bg-white flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/landing-pages')}>
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <div className="h-4 w-[1px] bg-gray-200" />
          <h2 className="font-bold text-sm truncate max-w-[200px]">{pageData?.title}</h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-gray-100 p-1 rounded-lg flex items-center">
            <Button 
              variant={previewMode === 'desktop' ? 'secondary' : 'ghost'} 
              size="icon" 
              className="h-8 w-8" 
              onClick={() => setPreviewMode('desktop')}
            >
              <MonitorIcon className="h-4 w-4" />
            </Button>
            <Button 
              variant={previewMode === 'mobile' ? 'secondary' : 'ghost'} 
              size="icon" 
              className="h-8 w-8" 
              onClick={() => setPreviewMode('mobile')}
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="outline" className="gap-2" onClick={() => window.open(`/lp/${pageData?.slug}`, '_blank')}>
            <Eye className="h-4 w-4" /> Preview Live
          </Button>
          <Button onClick={savePage} disabled={saving} className="gap-2 px-6 font-bold">
            <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Page'}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Section Library */}
        <aside className="w-72 border-r bg-white overflow-y-auto p-4 space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Add Sections</h3>
            <div className="grid grid-cols-1 gap-3">
              {SECTION_TEMPLATES.map((template) => (
                <button
                  key={template.type}
                  onClick={() => addSection(template)}
                  className="flex items-center gap-3 p-3 rounded-xl border-2 border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all text-left group"
                >
                  <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Plus className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">{template.label}</div>
                    <div className="text-[10px] text-muted-foreground leading-tight">{template.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Center Canvas */}
        <main className="flex-1 overflow-y-auto bg-gray-100/50 p-8 flex justify-center items-start">
          <div className={`${previewMode === 'mobile' ? 'w-[375px] h-fit min-h-[667px]' : 'w-full max-w-4xl'} bg-white shadow-2xl transition-all duration-300 rounded-lg overflow-hidden flex flex-col`}>
            {sections.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-4 px-10">
                <div className="h-20 w-20 bg-primary/5 text-primary rounded-full flex items-center justify-center">
                  <Plus className="h-10 w-10" />
                </div>
                <h4 className="font-bold text-xl">Start Building Your Page</h4>
                <p className="text-muted-foreground text-sm">Select a section from the left sidebar to add it to your landing page.</p>
              </div>
            ) : (
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis]}
              >
                <SortableContext 
                  items={sections.map(s => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="w-full">
                    {sections.map((section) => (
                      <SortableSectionItem 
                        key={section.id} 
                        section={section} 
                        isSelected={selectedSectionId === section.id}
                        onSelect={() => setSelectedSectionId(section.id)}
                        onDelete={() => deleteSection(section.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </main>

        {/* Right Sidebar - Editor */}
        <aside className="w-80 border-l bg-white overflow-y-auto shrink-0">
          {selectedSectionId ? (
            <SectionSettingsEditor 
              section={selectedSection}
              onUpdateContent={(content) => updateSectionContent(selectedSectionId, content)}
              onUpdateStyles={(styles) => updateSectionStyles(selectedSectionId, styles)}
              onClose={() => setSelectedSectionId(null)}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-4">
              <Settings className="h-10 w-10 opacity-20" />
              <p className="text-sm">Select a section on the canvas to edit its properties.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
