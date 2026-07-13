/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Link from 'next/link';
import { Instagram, Youtube, Twitter } from '@/components/ui/social-icons';
import { Sparkles, MoveUpRight } from 'lucide-react';
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

const socialLabels: Record<string, string> = {
  facebook: 'Facebook',
  twitter: 'X (Twitter)',
  instagram: 'Instagram',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  whatsapp: 'WhatsApp',
};

export default function FooterV5() {
  const currentYear = new Date().getFullYear();
  const settings = useSettings();
  const socialLinks = settings?.socialLinks || {};
  const hasSocialLinks = Object.values(socialLinks).some(v => v);

  return (
    <footer className="bg-neutral-50 dark:bg-neutral-950 py-40 px-6 overflow-hidden">
      <div className="container mx-auto">
        <div className="flex flex-col items-center text-center space-y-16 mb-40">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 text-primary font-black uppercase tracking-[0.6em] text-[10px]">
              <Sparkles className="h-4 w-4 fill-primary" /> The Artistic Conclusion
            </div>
            <h2 className="text-7xl md:text-[15rem] font-black tracking-tighter leading-none uppercase">
              Climax Apparels.
            </h2>
          </div>

          <div className="flex flex-wrap justify-center gap-12 md:gap-24">
            {['Discovery', 'Curated', 'Journal', 'Inquiry', 'Legal'].map((item, i) => (
              <Link
                key={item}
                href="#"
                className="group flex items-center gap-2 text-2xl md:text-5xl font-black uppercase tracking-tighter hover:text-primary transition-all"
              >
                {item} <MoveUpRight className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-2 group-hover:-translate-y-2" />
              </Link>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-16 items-end pt-20 border-t border-neutral-200 dark:border-neutral-800">
          {hasSocialLinks && (
            <div className="space-y-6">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-neutral-400">Identity Channels</span>
              <div className="flex gap-10">
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
                      className="hover:text-primary transition-colors flex items-center gap-2 text-sm font-black uppercase tracking-widest"
                    >
                      <Icon className="h-4 w-4" /> {socialLabels[platform] || platform}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <div className="text-center space-y-4">
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-400">Architecture by</div>
            <span className="text-2xl font-black uppercase tracking-tighter">Climax Apparels Atelier</span>
          </div>

          <div className="flex flex-col items-end gap-6">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 text-right">
              © {currentYear} ALL NARRATIVES PROTECTED. <br /> ESTABLISHED IN THE DIGITAL HORIZON.
            </p>
            <DeveloperLogo className="opacity-40 grayscale hover:grayscale-0 hover:opacity-100" />
          </div>
        </div>
      </div>
    </footer>
  );
}

