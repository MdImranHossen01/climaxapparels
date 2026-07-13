
import { FooterSelector } from '@/components/templates/ServerRegistry';

export default function Footer({ style = 'v1' }: { style?: string }) {
  return <FooterSelector style={style} />;
}

