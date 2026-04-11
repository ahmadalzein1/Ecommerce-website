import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name_en, name_ar, parent_id')
        .order('name_ar');

      // Build tree structure
      const map = {};
      const roots = [];

      (data || []).forEach((c) => {
        map[c.id] = { ...c, children: [] };
      });

      (data || []).forEach((c) => {
        if (c.parent_id && map[c.parent_id]) {
          map[c.parent_id].children.push(map[c.id]);
        } else {
          roots.push(map[c.id]);
        }
      });

      setCategories(roots);
      setLoading(false);
    };
    fetch();
  }, []);

  return { categories, loading };
}
