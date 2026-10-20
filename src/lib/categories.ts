export type CategoryItem = {
  name: string;
  icon: string;
  isCustom?: boolean;
};

export const DEFAULT_MAIN_CATEGORIES: CategoryItem[] = [
  { name: "Food", icon: "restaurant" },
  { name: "Transport", icon: "directions_subway" },
  { name: "Bill", icon: "receipt_long" },
  { name: "Groceries", icon: "shopping_cart" },
  { name: "Shopping", icon: "shopping_bag" },
  { name: "Entertainment", icon: "movie" },
  { name: "Other", icon: "credit_card" },
];

export const FOOTER_QUICK_CATEGORY: CategoryItem = {
  name: "Coffee",
  icon: "local_cafe",
};

const STORAGE_KEY = "qs-custom-categories";

export function getCustomCategories(): CategoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCustomCategories(items: CategoryItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("qs-categories-updated"));
  } catch (e) {
    console.error("Failed to save custom categories", e);
  }
}
