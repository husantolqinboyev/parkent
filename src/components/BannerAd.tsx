import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cacheGet, cacheSet } from "@/lib/indexedDB";

interface Banner {
  id: string;
  title: string | null;
  image_url: string;
  link_url: string | null;
}

interface CachedBannerData {
  banner: Banner;
  selectedAt: number;
  expiresAt: number;
}

const BANNER_CACHE_KEY = "selected_banner";
const DISMISS_KEY = "banner_dismissed_until";
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DISMISS_DURATION_MS = 2 * 60 * 1000; // 2 minutes

const BannerAd = () => {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [isHidden, setIsHidden] = useState(false);
  const { isPremium } = useAuth();

  const checkDismissed = useCallback((): boolean => {
    const dismissedUntil = localStorage.getItem(DISMISS_KEY);
    if (dismissedUntil) {
      const until = parseInt(dismissedUntil, 10);
      if (Date.now() < until) {
        return true;
      }
      localStorage.removeItem(DISMISS_KEY);
    }
    return false;
  }, []);

  const handleDismiss = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const dismissUntil = Date.now() + DISMISS_DURATION_MS;
    localStorage.setItem(DISMISS_KEY, dismissUntil.toString());
    setIsHidden(true);
  }, []);

  useEffect(() => {
    // Premium users don't see banners
    if (isPremium) {
      setIsHidden(true);
      return;
    }

    // Check if dismissed
    if (checkDismissed()) {
      setIsHidden(true);
      return;
    }

    const loadBanner = async () => {
      // Try to get cached banner from IndexedDB
      const cached = await cacheGet<CachedBannerData>(BANNER_CACHE_KEY);
      
      if (cached && Date.now() < cached.expiresAt) {
        // Use cached banner if still valid (within 24 hours)
        setBanner(cached.banner);
        return;
      }

      // Fetch all active banners from server
      const { data: banners } = await supabase
        .from("banners")
        .select("id, title, image_url, link_url")
        .eq("is_active", true)
        .eq("position", "header")
        .or("expires_at.is.null,expires_at.gt.now()");

      if (banners && banners.length > 0) {
        // Randomly select one banner
        const randomIndex = Math.floor(Math.random() * banners.length);
        const selectedBanner = banners[randomIndex];

        // Calculate expiry (end of current day or 24 hours from now)
        const now = Date.now();
        const tomorrow = new Date();
        tomorrow.setHours(24, 0, 0, 0);
        const expiresAt = tomorrow.getTime();

        // Cache the selected banner in IndexedDB for 24 hours
        const cacheData: CachedBannerData = {
          banner: selectedBanner,
          selectedAt: now,
          expiresAt: expiresAt,
        };

        await cacheSet(BANNER_CACHE_KEY, cacheData, DAY_IN_MS);
        setBanner(selectedBanner);
      }
    };

    loadBanner();
  }, [isPremium, checkDismissed]);

  // Don't render if premium user, dismissed, or no banner
  if (isPremium || isHidden || !banner) return null;

  const content = (
    <div className="relative h-16 overflow-hidden bg-gradient-to-r from-muted/30 to-muted/50 sm:h-20">
      <img
        src={banner.image_url}
        alt={banner.title || "Reklama"}
        className="h-full w-full object-cover"
      />
      <button
        onClick={handleDismiss}
        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-muted-foreground shadow-sm transition-all hover:bg-background hover:text-foreground hover:shadow-md"
        aria-label="Yopish"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  if (banner.link_url) {
    return (
      <a
        href={banner.link_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block transition-opacity hover:opacity-95"
      >
        {content}
      </a>
    );
  }

  return content;
};

export default BannerAd;
