import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const PAGE_SIZE = 12;
const cache = new Map();
const CACHE_TTL = 60000; // 1 minute

export function useProducts({ categoryId, colorId, searchQuery, sortBy, page = 0 } = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const fetchProducts = useCallback(async (resetPage = false) => {
    const currentPage = resetPage ? 0 : page;
    const cacheKey = JSON.stringify({ categoryId, colorId, searchQuery, sortBy, page: currentPage });
    
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setProducts(prev => resetPage ? cached.data : [...prev, ...cached.data]);
      setHasMore(cached.data.length === PAGE_SIZE);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('products')
        .select(`
          id, name, description, base_image_url, category_id, created_at,
          categories(id, name),
          product_colors(
            id,
            image_url,
            colors(id, name, hex_code)
          ),
          product_variants(
            id, size, stock_quantity, base_price, cost_price,
            product_color_id
          )
        `)
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      if (searchQuery && searchQuery.trim()) {
        query = query.ilike('name', `%${searchQuery.trim()}%`);
      }

      switch (sortBy) {
        case 'price-asc':
          query = query.order('created_at', { ascending: true });
          break;
        case 'price-desc':
          query = query.order('created_at', { ascending: false });
          break;
        case 'name-asc':
          query = query.order('name', { ascending: true });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      let filtered = data || [];

      // Client-side color filter since it's a nested relation
      if (colorId) {
        filtered = filtered.filter(p =>
          p.product_colors?.some(pc => pc.colors?.id === colorId)
        );
      }

      // Sort by price client-side (since price is on variants)
      if (sortBy === 'price-asc' || sortBy === 'price-desc') {
        filtered.sort((a, b) => {
          const aPrice = Math.min(...(a.product_variants?.map(v => Number(v.base_price)) || [0]));
          const bPrice = Math.min(...(b.product_variants?.map(v => Number(v.base_price)) || [0]));
          return sortBy === 'price-asc' ? aPrice - bPrice : bPrice - aPrice;
        });
      }

      cache.set(cacheKey, { data: filtered, ts: Date.now() });

      setProducts(prev => resetPage ? filtered : [...prev, ...filtered]);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [categoryId, colorId, searchQuery, sortBy, page]);

  useEffect(() => {
    fetchProducts(true);
  }, [categoryId, colorId, searchQuery, sortBy]);

  useEffect(() => {
    if (page > 0) fetchProducts(false);
  }, [page]);

  return { products, loading, hasMore, error, refetch: () => fetchProducts(true) };
}

export function useFeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('products')
        .select(`
          id, name, description, base_image_url, category_id, created_at,
          categories(id, name),
          product_colors(
            id,
            image_url,
            colors(id, name, hex_code)
          ),
          product_variants(
            id, size, stock_quantity, base_price, cost_price,
            product_color_id
          )
        `)
        .order('created_at', { ascending: false })
        .limit(8);

      setProducts(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  return { products, loading };
}
