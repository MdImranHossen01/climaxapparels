/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Link from 'next/link';
import { Instagram, Facebook, Twitter } from '@/components/ui/social-icons';
import { Star, Mail, MapPin, Phone } from 'lucide-react';
import DeveloperLogo from '@/components/ui/developerlogo';
import { useSettings } from '@/components/SettingsProvider';
import * as SocialIcons from '@/components/ui/social-icons';
import { Circle } from 'lucide-react';

const socialIconMap: Record<string, any> = {
   facebook: SocialIcons.Facebook || Circle,
   twitter: SocialIcons.Twitter || SocialIcons.X || Circle,
   instagram: SocialIcons.Instagram || Circle,
   youtube: SocialIcons.Youtube || Circle,
   linkedin: SocialIcons.Linkedin || Circle,
   tiktok: SocialIcons.Tiktok || Circle,
   whatsapp: SocialIcons.Whatsapp || Circle,
};

export default function FooterV4() {
   const currentYear = new Date().getFullYear();
   const settings = useSettings();
   const socialLinks = settings?.socialLinks || {};
   const hasSocialLinks = Object.values(socialLinks).some(v => v);

   return (
      <footer className="bg-[#fdfdfd] dark:bg-[#050505] pt-32 pb-16 px-6 border-t border-neutral-100 dark:border-neutral-900">
         <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-20 items-start mb-24">

               {/* Boutique Brand */}
               <div className="md:col-span-4 space-y-10">
                  <div className="space-y-4">
                     <Link href="/" className="text-5xl font-serif italic tracking-tighter hover:opacity-70 transition-opacity">
                        Climax Apparels
                     </Link>
                     <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.4em] text-[9px]">
                        <Star className="h-3 w-3 fill-current" /> The Boutique Atelier
                     </div>
                  </div>
                  <p className="text-muted-foreground text-lg font-serif italic leading-relaxed max-w-xs">
                     Exquisite collections curated for the discerning collector. Discover the art of intentional commerce.
                  </p>
                  {hasSocialLinks && (
                     <div className="flex items-center gap-8">
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
                                 aria-label={`Follow us on ${platform}`}
                                 className="text-neutral-400 hover:text-primary transition-colors"
                              >
                                 <Icon className="h-5 w-5 stroke-[1.5]" />
                              </Link>
                           );
                        })}
                     </div>
                  )}
               </div>

               {/* Elegant Navigation */}
               <div className="md:col-span-4 grid grid-cols-2 gap-12">
                  <div className="space-y-10">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-neutral-400">Atelier</h4>
                     <ul className="space-y-6">
                        {['Collections', 'Curated', 'Archive', 'Journal'].map(item => (
                           <li key={item}>
                              <Link href="#" className="text-sm font-serif italic hover:text-primary transition-colors">{item}</Link>
                           </li>
                        ))}
                     </ul>
                  </div>
                  <div className="space-y-10">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-neutral-400">Concierge</h4>
                     <ul className="space-y-6">
                        {['Assistance', 'Returns', 'Privacy', 'Security'].map(item => (
                           <li key={item}>
                              <Link href="#" className="text-sm font-serif italic hover:text-primary transition-colors">{item}</Link>
                           </li>
                        ))}
                     </ul>
                  </div>
               </div>

               {/* Boutique Presence */}
               <div className="md:col-span-4 space-y-10">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-neutral-400">Our Presence</h4>
                  <div className="space-y-6">
                     <div className="flex items-start gap-4 text-sm font-serif italic text-muted-foreground">
                        <MapPin className="h-5 w-5 text-primary mt-1 shrink-0" />
                        <span>{settings?.contact?.address || 'Elite Studio, Sector 07, Uttara, Dhaka, Bangladesh'}</span>
                     </div>
                     <div className="flex items-center gap-4 text-sm font-serif italic text-muted-foreground">
                        <Phone className="h-5 w-5 text-primary shrink-0" />
                        <span>{settings?.contact?.phone || '+880 1700 000 000'}</span>
                     </div>
                     <div className="flex items-center gap-4 text-sm font-serif italic text-muted-foreground">
                        <Mail className="h-5 w-5 text-primary shrink-0" />
                        <span>{settings?.contact?.email || 'concierge@Climax Apparels.com'}</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Elegant Legal Footer */}
            <div className="pt-16 border-t border-neutral-100 dark:border-neutral-900 flex flex-col md:flex-row items-center justify-between gap-8">
               <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">© {currentYear} Climax Apparels Boutique. All Essence Reserved.</p>
               <div className="flex gap-12 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">
                  <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
                  <Link href="#" className="hover:text-primary transition-colors">Legal</Link>
                  <Link href="#" className="hover:text-primary transition-colors">Atelier Map</Link>
               </div>
               <DeveloperLogo className="opacity-50 grayscale hover:grayscale-0 hover:opacity-100" />
            </div>
         </div>
      </footer>
   );
}

