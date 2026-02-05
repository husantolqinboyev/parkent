import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoryCard from "@/components/CategoryCard";
import { Button } from "@/components/ui/button";
import { useCategoriesCache } from "@/hooks/useListingsCache";
import { Loader2, RefreshCw, WifiOff } from "lucide-react";
import {
  Car,
  Home,
  Smartphone,
  Shirt,
  Sofa,
  Baby,
  Wrench,
  Briefcase,
  PawPrint,
  Bike,
  Wheat,
  Laptop,
  Camera,
  BookOpen,
  Dumbbell,
  LucideIcon,
  Package,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Car,
  Home,
  Smartphone,
  Shirt,
  Sofa,
  Baby,
  Wrench,
  Briefcase,
  PawPrint,
  Bike,
  Wheat,
  Laptop,
  Camera,
  BookOpen,
  Dumbbell,
};

const Categories = () => {
  const { categories, loading, isFromCache, refresh } = useCategoriesCache();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="container py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Kategoriyalar</h1>
              <p className="mt-1 text-muted-foreground flex items-center gap-2">
                Barcha kategoriyalar — {categories.length} ta
                {isFromCache && (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                    <WifiOff className="h-3 w-3" />
                    Keshdan
                  </span>
                )}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Yangilash
            </Button>
          </div>

          {loading && categories.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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
      </main>

      <Footer />
    </div>
  );
};

export default Categories;
