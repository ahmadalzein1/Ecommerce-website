import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useColors() {
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('colors')
        .select('id, name, hex_code')
        .order('name');

      setColors(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  return { colors, loading };
}
