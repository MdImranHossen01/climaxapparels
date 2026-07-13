
import { HeroSelector } from '@/components/templates/Registry';

export function HeroSlider({ style = 'v1', banners, layout }: { style?: string, banners: any[], layout?: string }) {
  return <HeroSelector style={style} banners={banners} layout={layout} />;
}


