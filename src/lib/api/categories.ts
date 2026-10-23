import { supabase } from './supabaseClient';
import { ServiceCategory } from '../../types';

export interface DbCategory {
  id: number;
  name: string;
  icon?: string;
}

let cachedCategories: DbCategory[] | null = null;

export async function getDbCategories(): Promise<DbCategory[]> {
  if (cachedCategories && cachedCategories.length > 0) {
    return cachedCategories;
  }

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('id', { ascending: true });

    if (!error && data && data.length > 0) {
      cachedCategories = data;
      return data;
    }
  } catch (err) {
    console.warn('Error fetching categories from Supabase:', err);
  }

  // Fallback defaults matching DB seed
  return [
    { id: 1, name: 'Electrician', icon: 'zap' },
    { id: 2, name: 'Plumber', icon: 'droplet' },
    { id: 3, name: 'Carpenter', icon: 'hammer' },
    { id: 4, name: 'Cleaner', icon: 'sparkles' },
    { id: 5, name: 'Cook', icon: 'chef-hat' },
    { id: 6, name: 'Delivery', icon: 'package' },
    { id: 7, name: 'Repair', icon: 'wrench' },
  ];
}

export function categoryNameToId(name: string, list?: DbCategory[]): number {
  const cats = list || cachedCategories || [];
  const normalized = name.toLowerCase();
  const found = cats.find((c) => c.name.toLowerCase() === normalized || c.name.toLowerCase().includes(normalized));
  if (found) return found.id;

  // Fallback mapping
  switch (normalized) {
    case 'electrician': return 1;
    case 'plumber': return 2;
    case 'carpenter': return 3;
    case 'cleaner': return 4;
    case 'cook': return 5;
    case 'delivery': return 6;
    case 'repair': return 7;
    default: return 1;
  }
}

export function categoryIdToName(id: number | null | undefined, list?: DbCategory[]): string {
  if (!id) return 'General';
  const cats = list || cachedCategories || [];
  const found = cats.find((c) => c.id === id);
  if (found) return found.name.toLowerCase();

  switch (id) {
    case 1: return 'electrician';
    case 2: return 'plumber';
    case 3: return 'carpenter';
    case 4: return 'cleaner';
    case 5: return 'cook';
    case 6: return 'delivery';
    case 7: return 'repair';
    default: return 'electrician';
  }
}
