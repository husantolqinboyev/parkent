import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ListingCard from "@/components/ListingCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal, RefreshCw, Loader2, Wifi, WifiOff } from "lucide-react";
import { useState } from "react";
import { useListingsCache, useCategoriesCache } from "@/hooks/useListingsCache";

const Listings = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  
  const { listings, loading: listingsLoading, isFromCache: listingsFromCache, refresh: refreshListings } = useListingsCache();
  const { categories, loading: categoriesLoading, isFromCache: categoriesFromCache, refresh: refreshCategories } = useCategoriesCache();

  const loading = listingsLoading && listings.length === 0;
  const isFromCache = listingsFromCache || categoriesFromCache;

  const handleRefresh = () => {
    refreshListings();
    refreshCategories();
  };

  const filteredListings = listings.filter((listing) => {
    const matchesSearch = listing.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" ||
      listing.categories?.name === categories.find((c) => c.slug === selectedCategory)?.name;
    return matchesSearch && matchesCategory;
  });

  const sortedListings = [...filteredListings].sort((a, b) => {
    if (sortBy === "price-low") return Number(a.price) - Number(b.price);
    if (sortBy === "price-high") return Number(b.price) - Number(a.price);
    if (sortBy === "premium") return (b.is_premium ? 1 : 0) - (a.is_premium ? 1 : 0);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

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

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="container py-8">
          {/* Page Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Barcha e'lonlar</h1>
              <p className="mt-1 text-muted-foreground flex items-center gap-2">
                {sortedListings.length} ta e'lon topildi
                {isFromCache && (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                    <WifiOff className="h-3 w-3" />
                    Keshdan
                  </span>
                )}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={listingsLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${listingsLoading ? 'animate-spin' : ''}`} />
              Yangilash
            </Button>
          </div>

          {/* Filters */}
          <div className="mb-8 flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Kategoriya" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha kategoriyalar</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.slug} value={category.slug}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Saralash" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Eng yangi</SelectItem>
                <SelectItem value="price-low">Narx: past → yuqori</SelectItem>
                <SelectItem value="price-high">Narx: yuqori → past</SelectItem>
                <SelectItem value="premium">Premium birinchi</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>

          {/* Listings Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sortedListings.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sortedListings.map((listing) => (
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
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 text-6xl">🔍</div>
              <h3 className="text-xl font-semibold text-foreground">
                E'lonlar topilmadi
              </h3>
              <p className="mt-2 text-muted-foreground">
                Qidiruv so'rovingizni o'zgartirib ko'ring
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Listings;
