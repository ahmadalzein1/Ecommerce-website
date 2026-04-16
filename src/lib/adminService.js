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
    const fileName = `${Date.now()}-${Math.floor(Math.random() * 10000)}.${fileExt}`;
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
    // Ensure base_image_url is from the first color mapping
    const finalProductData = {
      ...productData,
      base_image_url: colorMappings[0]?.image_url || null
    };

    // 1. Create Product
    const { data: product, error: pError } = await supabase
      .from('products')
      .insert([finalProductData])
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

  async updateFullProduct(productId, productData, variants, colorMappings) {
    // 1. Update Product
    const finalProductData = {
      ...productData,
      base_image_url: colorMappings[0]?.image_url || null
    };

    const { error: pError } = await supabase
      .from('products')
      .update(finalProductData)
      .eq('id', productId);

    if (pError) throw pError;

    // 2. Sync Product Colors
    // For simplicity in a wizard, we'll fetch existing and diff
    const { data: existingColors } = await supabase.from('product_colors').select('*').eq('product_id', productId);
    
    // Delete colors not in new list
    const newColorIds = colorMappings.map(c => c.color_id);
    const colorsToDelete = existingColors.filter(c => !newColorIds.includes(c.color_id));
    if (colorsToDelete.length > 0) {
      await supabase.from('product_colors').delete().in('id', colorsToDelete.map(c => c.id));
    }

    // Upsert new/existing colors
    const colorsToUpsert = colorMappings.map(cm => ({
      product_id: productId,
      color_id: cm.color_id,
      image_url: cm.image_url
    }));

    const { data: pColors, error: pcError } = await supabase
      .from('product_colors')
      .upsert(colorsToUpsert, { onConflict: 'product_id,color_id' })
      .select();

    if (pcError) throw pcError;

    // 3. Sync Variants
    // Fetch existing variants to avoid deleting those with orders or to update them
    const { data: existingVariants } = await supabase.from('product_variants').select('*').eq('product_id', productId);
    
    const variantsToInsert = [];
    const variantsToUpdate = [];
    
    for (const v of variants) {
      const pColor = pColors.find(pc => pc.color_id === v.color_id);
      const existing = existingVariants.find(ev => ev.product_color_id === pColor?.id && ev.size === v.size);
      
      const variantData = {
        product_id: productId,
        product_color_id: pColor?.id,
        size: v.size,
        stock_quantity: v.stock_quantity,
        base_price: v.base_price,
        cost_price: v.cost_price
      };

      if (existing) {
        variantsToUpdate.push({ id: existing.id, ...variantData });
      } else {
        variantsToInsert.push(variantData);
      }
    }

    // Insert new ones
    if (variantsToInsert.length > 0) {
      await supabase.from('product_variants').insert(variantsToInsert);
    }

    // Update existing ones
    for (const uv of variantsToUpdate) {
      await supabase.from('product_variants').update(uv).eq('id', uv.id);
    }

    // Delete variants that are no longer in the list AND don't have orders (as a safety measure)
    const activeVariantKeys = variants.map(v => {
      const pColor = pColors.find(pc => pc.color_id === v.color_id);
      return `${pColor?.id}-${v.size}`;
    });
    
    const variantsToRemove = existingVariants.filter(ev => !activeVariantKeys.includes(`${ev.product_color_id}-${ev.size}`));
    
    if (variantsToRemove.length > 0) {
      // Only delete if not in order_items
      for (const rv of variantsToRemove) {
        const { data: orders } = await supabase.from('order_items').select('id').eq('product_variant_id', rv.id).limit(1);
        if (!orders || orders.length === 0) {
          await supabase.from('product_variants').delete().eq('id', rv.id);
        } else {
          // If it has orders, just set stock to 0 instead of deleting
          await supabase.from('product_variants').update({ stock_quantity: 0 }).eq('id', rv.id);
        }
      }
    }

    return { id: productId };
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

  async deleteProduct(productId) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);
    if (error) throw error;
  },

};

