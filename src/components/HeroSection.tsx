import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import heroBanner from "@/assets/hero-banner.jpg";

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/listings?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <section className="relative overflow-hidden bg-card">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src={heroBanner}
          alt="Parkent bozori"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
      </div>

      <div className="container relative py-16 md:py-24 lg:py-32">
        <div className="max-w-2xl">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Parkentdagi eng yaxshi <span className="text-primary">e'lonlar</span> platformasi
          </h1>
          <p className="mb-8 text-lg text-muted-foreground md:text-xl">
            Sotish, sotib olish yoki ijaraga berish — hamma narsa bir joyda. Telegram orqali tez va oson ro'yxatdan o'ting.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Nimani qidiryapsiz?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 pl-10 text-base"
                />
              </div>
              <Button type="submit" size="lg" className="h-12">
                Qidirish
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary">500+</span>
              <span className="text-muted-foreground">Faol e'lonlar</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary">1,200+</span>
              <span className="text-muted-foreground">Foydalanuvchilar</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary">15+</span>
              <span className="text-muted-foreground">Kategoriyalar</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
