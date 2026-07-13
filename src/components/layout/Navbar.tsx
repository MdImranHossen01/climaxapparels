
import { NavbarSelector } from '@/components/templates/Registry';

export default function Navbar({ style = 'v1' }: { style?: string }) {
  return <NavbarSelector style={style} />;
}

