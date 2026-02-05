import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CategoryCard from "@/components/CategoryCard";
import ListingCard from "@/components/ListingCard";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Car,
  Home,
  Smartphone,
  Shirt,
  Sofa,
  Baby,
  Wrench,
  Briefcase,
  LucideIcon,
  Package,
} from "lucide-react";

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

const iconMap: Record<string, LucideIcon> = {
  Car,
  Home,
  Smartphone,
  Shirt,
  Sofa,
  Baby,
  Wrench,
  Briefcase,
};

const Index = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const { data: categoriesData } = await supabase
          .from("categories")
          .select("*")
          .order("listing_count", { ascending: false })
          .limit(8);

        if (categoriesData) {
          setCategories(categoriesData);
        }

        // Fetch active listings
        const { data: listingsData } = await supabase
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
          .order("created_at", { ascending: false })
          .limit(8);

        if (listingsData) {
          setListings(listingsData as Listing[]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Hozirgina";
    if (diffHours < 24) return `${diffHours} soat oldin`;
    if (diffDays < 7) return `${diffDays} kun oldin`;
    return date.toLocaleDateString("uz-UZ");
  };

  const premiumListings = listings.filter((l) => l.is_premium);
  const regularListings = listings.filter((l) => !l.is_premium).slice(0, 4);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <HeroSection />

        {/* Categories Section */}
        <section className="py-12 md:py-16">
          <div className="container">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                  Kategoriyalar
                </h2>
                <p className="mt-1 text-muted-foreground">
                  Kerakli tovar yoki xizmatni toping
                </p>
              </div>
              <Link to="/categories">
                <Button variant="outline">
                  Hammasi
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
                {categories.map((category) => (
                  <CategoryCard 
                    key={category.slug} 
                    name={category.name}
                    slug={category.slug}
                    count={category.listing_count}
                    icon={iconMap[category.icon] || Package}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Premium Listings Section */}
        {premiumListings.length > 0 && (
          <section className="bg-accent/30 py-12 md:py-16">
            <div className="container">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                    ⭐ Premium e'lonlar
                  </h2>
                  <p className="mt-1 text-muted-foreground">
                    Eng sara takliflar
                  </p>
                </div>
                <Link to="/listings?type=premium">
                  <Button variant="outline">
                    Hammasi
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {premiumListings.map((listing) => (
                  <ListingCard 
                    key={listing.id}
                    id={listing.id}
                    title={listing.title}
                    price={Number(listing.price)}
                    location={listing.location || "Parkent"}
                    imageUrl={listing.images?.[0] || "/placeholder.svg"}
                    createdAt={formatTimeAgo(listing.created_at)}
                    isPremium={listing.is_premium}
                    category={listing.categories?.name || "Boshqa"}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Latest Listings Section */}
        <section className="py-12 md:py-16">
          <div className="container">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                  Oxirgi e'lonlar
                </h2>
                <p className="mt-1 text-muted-foreground">
                  Eng so'nggi qo'shilgan e'lonlar
                </p>
              </div>
              <Link to="/listings">
                <Button variant="outline">
                  Hammasi
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : regularListings.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {regularListings.map((listing) => (
                  <ListingCard 
                    key={listing.id}
                    id={listing.id}
                    title={listing.title}
                    price={Number(listing.price)}
                    location={listing.location || "Parkent"}
                    imageUrl={listing.images?.[0] || "/placeholder.svg"}
                    createdAt={formatTimeAgo(listing.created_at)}
                    isPremium={listing.is_premium}
                    category={listing.categories?.name || "Boshqa"}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Hozircha e'lonlar yo'q. Birinchi bo'lib e'lon joylaydigan siz bo'ling!
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-border bg-primary/5 py-12 md:py-16">
          <div className="container text-center">
            <h2 className="mb-4 text-2xl font-bold text-foreground md:text-3xl">
              E'lon joylashni xohlaysizmi?
            </h2>
            <p className="mx-auto mb-6 max-w-2xl text-muted-foreground">
              Telegram orqali ro'yxatdan o'ting va darhol o'z e'loningizni joylang. 
              Bu bepul va juda oson!
            </p>
            <Link to="/auth">
              <Button size="lg">
                Telegram orqali ro'yxatdan o'tish
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
