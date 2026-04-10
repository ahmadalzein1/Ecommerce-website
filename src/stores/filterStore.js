import { create } from 'zustand';

const useFilterStore = create((set) => ({
  categoryId: null,
  colorId: null,
  searchQuery: '',
  sortBy: 'newest',
  priceRange: [0, 1000],

  setCategoryId: (id) => set({ categoryId: id }),
  setColorId: (id) => set({ colorId: id }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSortBy: (s) => set({ sortBy: s }),
  setPriceRange: (r) => set({ priceRange: r }),
  resetFilters: () =>
    set({
      categoryId: null,
      colorId: null,
      searchQuery: '',
      sortBy: 'newest',
      priceRange: [0, 1000],
    }),
}));

export default useFilterStore;
