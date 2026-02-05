// Local storage utility for user preferences and recently viewed categories

const LAST_CATEGORY_KEY = "parkent_last_category";
const RECENTLY_VIEWED_KEY = "parkent_recently_viewed";

interface RecentlyViewed {
  listingId: string;
  categorySlug: string;
  timestamp: number;
}

/**
 * Save the last viewed category
 */
export const setLastCategory = (categorySlug: string): void => {
  try {
    localStorage.setItem(LAST_CATEGORY_KEY, categorySlug);
  } catch (e) {
    console.warn("localStorage not available:", e);
  }
};

/**
 * Get the last viewed category
 */
export const getLastCategory = (): string | null => {
  try {
    return localStorage.getItem(LAST_CATEGORY_KEY);
  } catch (e) {
    console.warn("localStorage not available:", e);
    return null;
  }
};

/**
 * Add a listing to recently viewed
 */
export const addRecentlyViewed = (listingId: string, categorySlug: string): void => {
  try {
    const existing = getRecentlyViewed();
    
    // Remove if already exists
    const filtered = existing.filter(item => item.listingId !== listingId);
    
    // Add to beginning
    filtered.unshift({
      listingId,
      categorySlug,
      timestamp: Date.now(),
    });
    
    // Keep only last 20
    const trimmed = filtered.slice(0, 20);
    
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(trimmed));
    
    // Also update last category
    setLastCategory(categorySlug);
  } catch (e) {
    console.warn("localStorage not available:", e);
  }
};

/**
 * Get recently viewed listings
 */
export const getRecentlyViewed = (): RecentlyViewed[] => {
  try {
    const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as RecentlyViewed[];
  } catch (e) {
    console.warn("localStorage not available:", e);
    return [];
  }
};

/**
 * Get the most frequently viewed category from recent history
 */
export const getMostViewedCategory = (): string | null => {
  try {
    const recent = getRecentlyViewed();
    if (recent.length === 0) return null;
    
    // Count category occurrences
    const counts: Record<string, number> = {};
    for (const item of recent) {
      counts[item.categorySlug] = (counts[item.categorySlug] || 0) + 1;
    }
    
    // Find max
    let maxCategory = "";
    let maxCount = 0;
    for (const [cat, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        maxCategory = cat;
      }
    }
    
    return maxCategory || null;
  } catch (e) {
    console.warn("localStorage not available:", e);
    return null;
  }
};

/**
 * Clear all preferences
 */
export const clearPreferences = (): void => {
  try {
    localStorage.removeItem(LAST_CATEGORY_KEY);
    localStorage.removeItem(RECENTLY_VIEWED_KEY);
  } catch (e) {
    console.warn("localStorage not available:", e);
  }
};
