import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useProductDetail(productId) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!productId) return;

    const fetch = async () => {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('products')
        .select(`
          id, name, description, base_image_url, category_id, created_at,
          categories(id, name),
          product_colors(
            id,
            image_url,
            color_id,
            colors(id, name, hex_code)
          ),
          product_variants(
            id, size, stock_quantity, base_price, cost_price,
            product_color_id
          )
        `)
        .eq('id', productId)
        .single();

      if (err) {
        setError(err.message);
      } else {
        setProduct(data);
      }
      setLoading(false);
    };
    fetch();
  }, [productId]);

  return { product, loading, error };
}

export function useRelatedProducts(categoryId, excludeId) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categoryId) {
      setLoading(false);
      return;
    }

    const fetch = async () => {
      const { data } = await supabase
        .from('products')
        .select(`
          id, name, base_image_url,
          product_colors(id, image_url, colors(id, name, hex_code)),
          product_variants(id, base_price, stock_quantity)
        `)
        .eq('category_id', categoryId)
        .neq('id', excludeId)
        .limit(4);

      setProducts(data || []);
      setLoading(false);
    };
    fetch();
  }, [categoryId, excludeId]);

  return { products, loading };
}
