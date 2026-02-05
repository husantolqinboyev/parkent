import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cacheGet, cacheSet } from "@/lib/indexedDB";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  listing_count: number;
}

interface Listing {
  id: string;
  title: string;
  price: number;
  location: string | null;
  images: string[];
  is_premium: boolean;
  created_at: string;
  categories: { name: string } | null;
}

const LISTINGS_CACHE_KEY = "active_listings";
const CATEGORIES_CACHE_KEY = "all_categories";
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

export const useListingsCache = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);

  const fetchListings = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    try {
      // Try cache first if not forcing refresh
      if (!forceRefresh) {
        const cached = await cacheGet<Listing[]>(LISTINGS_CACHE_KEY);
        if (cached && cached.length > 0) {
          setListings(cached);
          setIsFromCache(true);
          setLoading(false);
          // Still fetch fresh data in background
          fetchFreshListings();
          return;
        }
      }

      await fetchFreshListings();
    } catch (error) {
      console.error("Error fetching listings:", error);
      setLoading(false);
    }
  }, []);

  const fetchFreshListings = async () => {
    const { data, error } = await supabase
      .from("listings")
      .select(`
        id,
        title,
        price,
        location,
        images,
        is_premium,
        created_at,
        categories:category_id (name)
      `)
      .eq("status", "active")
      .order("is_premium", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;

    const listingsData = (data || []) as Listing[];
    setListings(listingsData);
    setIsFromCache(false);
    setLoading(false);

    // Cache the data
    await cacheSet(LISTINGS_CACHE_KEY, listingsData, CACHE_TTL);
  };

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  return { listings, loading, isFromCache, refresh: () => fetchListings(true) };
};

export const useCategoriesCache = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);

  const fetchCategories = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    try {
      // Try cache first if not forcing refresh
      if (!forceRefresh) {
        const cached = await cacheGet<Category[]>(CATEGORIES_CACHE_KEY);
        if (cached && cached.length > 0) {
          setCategories(cached);
          setIsFromCache(true);
          setLoading(false);
          // Still fetch fresh data in background
          fetchFreshCategories();
          return;
        }
      }

      await fetchFreshCategories();
    } catch (error) {
      console.error("Error fetching categories:", error);
      setLoading(false);
    }
  }, []);

  const fetchFreshCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) throw error;

    const categoriesData = (data || []) as Category[];
    setCategories(categoriesData);
    setIsFromCache(false);
    setLoading(false);

    // Cache the data
    await cacheSet(CATEGORIES_CACHE_KEY, categoriesData, CACHE_TTL);
  };

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, loading, isFromCache, refresh: () => fetchCategories(true) };
};
