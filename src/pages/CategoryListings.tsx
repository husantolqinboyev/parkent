import { useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ListingCard from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, RefreshCw, WifiOff } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
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

const CategoryListings = () => {
  const { slug } = useParams<{ slug: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!slug) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch category by slug
      const { data: categoryData, error: categoryError } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", slug)
        .single();

      if (categoryError || !categoryData) {
        setError("Kategoriya topilmadi");
        setLoading(false);
        return;
      }

      setCategory(categoryData);

      // Fetch listings for this category
      const { data: listingsData, error: listingsError } = await supabase
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
        .eq("category_id", categoryData.id)
        .eq("status", "active")
        .order("is_premium", { ascending: false })
        .order("created_at", { ascending: false });

      if (listingsError) throw listingsError;
      
      setListings((listingsData as Listing[]) || []);
    } catch (err) {
      console.error("Error fetching category data:", err);
      setError("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [slug]);

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

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-6xl">😕</div>
            <h1 className="mb-2 text-2xl font-bold text-foreground">
              {error || "Kategoriya topilmadi"}
            </h1>
            <p className="mb-4 text-muted-foreground">
              Bu kategoriya mavjud emas yoki o'chirilgan
            </p>
            <Link to="/categories">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kategoriyalarga qaytish
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="container py-8">
          {/* Page Header */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/categories">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="flex items-center gap-2 text-3xl font-bold text-foreground">
                  <span className="text-4xl">{category.icon}</span>
                  {category.name}
                </h1>
                <p className="mt-1 text-muted-foreground">
                  {listings.length} ta e'lon topildi
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Yangilash
            </Button>
          </div>

          {/* Listings Grid */}
          {listings.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  id={listing.id}
                  title={listing.title}
                  price={Number(listing.price)}
                  location={listing.location || "Parkent"}
                  imageUrl={listing.images?.[0] || "/placeholder.svg"}
                  createdAt={formatTimeAgo(listing.created_at)}
                  isPremium={listing.is_premium}
                  category={listing.categories?.name || category.name}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 text-6xl">📭</div>
              <h3 className="text-xl font-semibold text-foreground">
                Bu kategoriyada e'lonlar yo'q
              </h3>
              <p className="mt-2 text-muted-foreground">
                Birinchi bo'lib e'lon joylaydigan siz bo'ling!
              </p>
              <Link to="/create" className="mt-4">
                <Button>E'lon joylash</Button>
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CategoryListings;
