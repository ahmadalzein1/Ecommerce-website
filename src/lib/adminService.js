import { supabase } from './supabase';

const BUCKET_NAME = 'images';

export const adminService = {
  // --- STORAGE ---
  async uploadImage(file) {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  // --- PRODUCTS ---
  async fetchFullProducts() {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories(name_ar, name_en),
        product_variants(*, product_colors(color_id, colors(name_ar, hex_code))),
        product_colors(*, colors(*))
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createFullProduct(productData, variants, colorMappings) {
    // 1. Create Product
    const { data: product, error: pError } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single();

    if (pError) throw pError;

    // 2. Create Product Colors (Mappings)
    const colorsToInsert = colorMappings.map(cm => ({
      product_id: product.id,
      color_id: cm.color_id,
      image_url: cm.image_url
    }));

    const { data: pColors, error: pcError } = await supabase
      .from('product_colors')
      .insert(colorsToInsert)
      .select();

    if (pcError) throw pcError;

    // 3. Create Variants
    const variantsToInsert = variants.map(v => {
      // Find the product_color_id matching this variant's color
      const pColor = pColors.find(pc => pc.color_id === v.color_id);
      return {
        product_id: product.id,
        product_color_id: pColor?.id,
        size: v.size,
        stock_quantity: v.stock_quantity,
        base_price: v.base_price,
        cost_price: v.cost_price
      };
    });

    const { error: vError } = await supabase
      .from('product_variants')
      .insert(variantsToInsert);

    if (vError) throw vError;

    return product;
  },

  // --- CATEGORIES ---
  async fetchCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name_ar');
    if (error) throw error;
    return data;
  },

  // --- COLORS ---
  async fetchColors() {
    const { data, error } = await supabase
      .from('colors')
      .select('*')
      .order('name_ar');
    if (error) throw error;
    return data;
  },

  // --- DISCOUNT CODES ---
  async fetchDiscountCodes() {
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return { data: [] }; // Handle missing table gracefully
    return { data: data || [] };
  },

  async deleteProduct(productId) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);
    if (error) throw error;
  }
};
