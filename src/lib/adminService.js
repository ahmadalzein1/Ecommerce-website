import { supabase } from './supabase';
import { errorService } from './errorService';

const BUCKET_NAME = 'images';

export const adminService = {
  // --- UTILS ---
  handleError(error, language = 'en') {
    return errorService.translate(error, language);
  },
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

    const { data: finalVariants, error: vError } = await supabase
      .from('product_variants')
      .insert(variantsToInsert)
      .select();

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

  async createCategory(categoryData) {
    const { data, error } = await supabase
      .from('categories')
      .insert([categoryData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateCategory(id, categoryData) {
    const { data, error } = await supabase
      .from('categories')
      .update(categoryData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteCategory(id) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    if (error) throw error;
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

  async createColor(colorData) {
    // Case-insensitive uniqueness check
    const { data: existing } = await supabase
      .from('colors')
      .select('id')
      .or(`name_ar.ilike."${colorData.name_ar}",name_en.ilike."${colorData.name_en}"`)
      .limit(1);

    if (existing && existing.length > 0) {
      throw { code: '23505', message: 'Duplicate name' };
    }

    const { data, error } = await supabase
      .from('colors')
      .insert([colorData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateColor(id, colorData) {
    // Case-insensitive uniqueness check (excluding current record)
    const { data: existing } = await supabase
      .from('colors')
      .select('id')
      .or(`name_ar.ilike."${colorData.name_ar}",name_en.ilike."${colorData.name_en}"`)
      .neq('id', id)
      .limit(1);

    if (existing && existing.length > 0) {
      throw { code: '23505', message: 'Duplicate name' };
    }

    const { data, error } = await supabase
      .from('colors')
      .update(colorData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteColor(id) {
    const { error } = await supabase
      .from('colors')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // --- DISCOUNT CODES ---
  async fetchDiscountCodes() {
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return { data: [] };
    return { data: data || [] };
  },

  async createDiscountCode(discountData) {
    const { data, error } = await supabase
      .from('discount_codes')
      .insert([discountData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateDiscountCode(id, discountData) {
    const { data, error } = await supabase
      .from('discount_codes')
      .update(discountData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteDiscountCode(id) {
    const { error } = await supabase
      .from('discount_codes')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async deleteProduct(productId) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);
    if (error) throw error;
  },

};
