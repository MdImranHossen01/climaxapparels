/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Link from 'next/link';
import { Cpu, ShieldCheck, Zap, MoveRight, Mail, Phone, MapPin, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DeveloperLogo from '@/components/ui/developerlogo';
import { useSettings } from '@/components/SettingsProvider';
import * as SocialIcons from '@/components/ui/social-icons';

const socialIconMap: Record<string, any> = {
   facebook: SocialIcons.Facebook || Circle,
   twitter: SocialIcons.Twitter || SocialIcons.X || Circle,
   instagram: SocialIcons.Instagram || Circle,
   youtube: SocialIcons.Youtube || Circle,
   linkedin: SocialIcons.Linkedin || Circle,
   tiktok: SocialIcons.Tiktok || Circle,
   whatsapp: SocialIcons.Whatsapp || Circle,
};

export default function FooterV3() {
   const currentYear = new Date().getFullYear();
   const settings = useSettings();
   const socialLinks = settings?.socialLinks || {};
   const hasSocialLinks = Object.values(socialLinks).some(v => v);

   return (
      <footer className="bg-[#0f1111] text-white border-t-2 border-white/5 py-24 px-6 font-mono">
         <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">

               {/* Module: Branding */}
               <div className="space-y-8">
                  <div className="flex items-center gap-3 text-primary">
                     <Cpu className="h-6 w-6" />
                     <span className="font-black text-sm sm:text-base md:text-xl tracking-tighter break-words max-w-[200px] md:max-w-none">Climax Apparels</span>
                  </div>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-widest leading-relaxed">
                     Systematic commerce architecture. High-precision retail logistics. Distributed from DHAKA_HQ.
                  </p>
                  {hasSocialLinks && (
                     <div className="flex items-center gap-4">
                        {Object.entries(socialLinks).map(([platform, url]) => {
                           if (!url) return null;
                           const Icon = socialIconMap[platform];
                           if (!Icon) return null;

                           return (
                              <Link
                                 key={platform}
                                 href={url as string}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="text-neutral-500 hover:text-primary transition-all hover:scale-110"
                                 aria-label={platform}
                              >
                                 <Icon size={16} strokeWidth={2} />
                              </Link>
                           );
                        })}
                     </div>
                  )}
                  <div className="flex items-center gap-3">
                     <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                     <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/60">SYS_STATUS: OPTIMAL</span>
                  </div>
               </div>

               {/* Module: Registry */}
               <div className="space-y-8">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Registry_Link</h4>
                  <div className="flex flex-col gap-4">
                     {['Shop', 'Categories', 'Flash_Sale', 'Archive', 'Protocol'].map(item => (
                        <Link key={item} href="#" className="text-xs font-black uppercase hover:text-primary transition-all flex items-center justify-between group">
                           {item} <MoveRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-2" />
                        </Link>
                     ))}
                  </div>
               </div>

               {/* Module: Communication */}
               <div className="space-y-8">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Comm_Links</h4>
                  <div className="space-y-4">
                     <div className="flex items-center gap-4 text-xs text-neutral-400">
                        <Mail className="h-4 w-4 text-primary" /> {settings?.contact?.email || 'support@climaxapparels.com'}
                     </div>
                     <div className="flex items-center gap-4 text-xs text-neutral-400">
                        <Phone className="h-4 w-4 text-primary" /> {settings?.contact?.phone || '+880 1234 5678'}
                     </div>
                     <div className="flex items-center gap-4 text-xs text-neutral-400">
                        <MapPin className="h-4 w-4 text-primary" /> {settings?.contact?.address || 'Sector 07, Uttara, Dhaka'}
                     </div>
                  </div>
               </div>

               {/* Module: Uplink */}
               <div className="space-y-8">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">SYS_Uplink</h4>
                  <div className="space-y-6">
                     <p className="text-[10px] text-neutral-500 uppercase tracking-widest">Connect to global commerce feed.</p>
                     <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
                        <label htmlFor="user-ident" className="sr-only">Newsletter Email</label>
                        <input
                           id="user-ident"
                           name="user-ident"
                           aria-label="Newsletter Email"
                           className="w-full bg-white/5 border border-white/10 rounded-xl px-4 h-12 text-xs focus:outline-none focus:border-primary transition-all"
                           placeholder="USER_IDENT"
                           required
                           type="email"
                        />
                        <Button type="submit" className="w-full h-12 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest">INIT_UPLINK</Button>
                     </form>
                  </div>
               </div>
            </div>

            {/* System Protocol Footer */}
            <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 text-[9px] font-black uppercase tracking-widest text-neutral-700">
               <div className="flex items-center gap-6">
                  <span>© {currentYear} CORE_MODULES</span>
                  <span className="flex items-center gap-2"><ShieldCheck className="h-3 w-3 text-primary" /> SECURED_V4.1</span>
               </div>
               <div className="flex gap-8">
                  <Link href="#" className="hover:text-primary transition-colors">DE_PRIVACY</Link>
                  <Link href="#" className="hover:text-primary transition-colors">DE_TERMS</Link>
               </div>
               <DeveloperLogo className="opacity-40 grayscale hover:grayscale-0 hover:opacity-100 invert scale-75 md:scale-90" />
            </div>
         </div>
      </footer>
   );
}

