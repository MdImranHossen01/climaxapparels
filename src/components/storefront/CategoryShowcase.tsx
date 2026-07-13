
import { CategorySelector } from '@/components/templates/Registry';

export function CategoryShowcase({ style = 'v1', categories }: { style?: string, categories: any[] }) {
  return <CategorySelector style={style} categories={categories} />;
}

