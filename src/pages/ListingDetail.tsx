import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Crown,
  Phone,
  MessageCircle,
  Share2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { addRecentlyViewed } from "@/lib/userPreferences";
import { escapeHtml } from "@/lib/sanitize";

interface Listing {
  id: string;
  title: string;
  description: string | null;
  price: number;
  location: string | null;
  images: string[];
  is_premium: boolean;
  created_at: string;
  expires_at: string | null;
  views_count: number;
  status: string;
  profiles: {
    display_name: string | null;
    telegram_username: string | null;
    phone: string | null;
  } | null;
  categories: { name: string; slug: string } | null;
}

const ListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const len = listing?.images?.filter(Boolean).length ?? 0;
    const safeLen = len > 0 ? len : 1;
    if (currentImageIndex >= safeLen) setCurrentImageIndex(0);
  }, [listing?.id, listing?.images?.length, currentImageIndex]);

  useEffect(() => {
    const fetchListing = async () => {
      if (!id) return;

      setLoading(true);
      try {
        // First get the listing
        const { data: listingData, error: listingError } = await supabase
          .from("listings")
          .select(`
            *,
            categories:category_id (name, slug)
          `)
          .eq("id", id)
          .single();

        if (listingError) throw listingError;

        // Then get the profile separately
        const { data: profileData } = await supabase
          .from("profiles")
          .select("display_name, telegram_username, phone")
          .eq("user_id", listingData.user_id)
          .single();

        const data = {
          ...listingData,
          profiles: profileData,
        };
        
        setListing(data as Listing);

        // Track recently viewed for recommendations
        if (listingData.categories?.slug) {
          addRecentlyViewed(listingData.id, listingData.categories.slug);
        }

        // Increment view count
        await supabase
          .from("listings")
          .update({ views_count: (listingData.views_count || 0) + 1 })
          .eq("id", id);
      } catch (error) {
        console.error("Error fetching listing:", error);
        toast.error("E'lonni yuklashda xatolik");
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handlePrevImage = () => {
    if (!listing?.images?.length) return;
    setCurrentImageIndex((prev) =>
      prev === 0 ? listing.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    if (!listing?.images?.length) return;
    setCurrentImageIndex((prev) =>
      prev === listing.images.length - 1 ? 0 : prev + 1
    );
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: listing?.title,
        text: `${listing?.title} - ${listing?.price?.toLocaleString()} so'm`,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Havola nusxalandi");
    }
  };

  const handleContact = (type: "telegram" | "phone") => {
    if (type === "telegram" && listing?.profiles?.telegram_username) {
      window.open(`https://t.me/${listing.profiles.telegram_username}`, "_blank");
    } else if (type === "phone" && listing?.profiles?.phone) {
      window.open(`tel:${listing.profiles.phone}`, "_blank");
    } else {
      toast.error("Bog'lanish ma'lumoti mavjud emas");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="aspect-[4/3] w-full rounded-xl" />
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 text-6xl">😕</div>
            <h2 className="text-2xl font-bold text-foreground">E'lon topilmadi</h2>
            <p className="mt-2 text-muted-foreground">
              Bu e'lon mavjud emas yoki o'chirilgan
            </p>
            <Button className="mt-6" onClick={() => navigate("/listings")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              E'lonlarga qaytish
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const images = listing.images?.filter(Boolean).length
    ? listing.images.filter(Boolean)
    : ["/placeholder.svg"];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <div className="container py-8">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Bosh sahifa</Link>
            <span>/</span>
            <Link to="/listings" className="hover:text-foreground">E'lonlar</Link>
            {listing.categories && (
              <>
                <span>/</span>
                <Link
                  to={`/listings?category=${listing.categories.slug}`}
                  className="hover:text-foreground"
                >
                  {listing.categories.name}
                </Link>
              </>
            )}
          </nav>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Gallery */}
              <div className="relative overflow-hidden rounded-xl bg-muted">
                <div className="relative aspect-[4/3]">
                  <img
                    src={images[currentImageIndex]}
                    alt={listing.title}
                    className="h-full w-full object-contain"
                  />
                  
                  {listing.is_premium && (
                    <Badge className="absolute left-4 top-4 bg-primary text-primary-foreground gap-1">
                      <Crown className="h-3 w-3" />
                      Premium
                    </Badge>
                  )}

                  {images.length > 1 && (
                    <>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2"
                        onClick={handlePrevImage}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={handleNextImage}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-2 p-4 overflow-x-auto">
                    {images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden ${
                          index === currentImageIndex
                            ? "ring-2 ring-primary"
                            : "ring-1 ring-border hover:ring-primary/50"
                        }`}
                      >
                        <img
                          src={img}
                          alt={`${listing.title} ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Title & Price */}
              <div>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground md:text-3xl">
                      {listing.title}
                    </h1>
                    {listing.categories && (
                      <Badge variant="secondary" className="mt-2">
                        {listing.categories.name}
                      </Badge>
                    )}
                  </div>
                  <Button variant="outline" size="icon" onClick={handleShare}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-4 text-3xl font-bold text-primary">
                  {listing.price.toLocaleString("uz-UZ")} so'm
                </p>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {listing.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{listing.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(listing.created_at)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{listing.views_count} ko'rilgan</span>
                </div>
              </div>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Ta'rif</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {listing.description || "Ta'rif mavjud emas"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Seller Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sotuvchi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {listing.profiles?.display_name ||
                          listing.profiles?.telegram_username ||
                          "Foydalanuvchi"}
                      </p>
                      {listing.profiles?.telegram_username && (
                        <p className="text-sm text-muted-foreground">
                          @{listing.profiles.telegram_username}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Button
                      className="w-full"
                      onClick={() => handleContact("telegram")}
                      disabled={!listing.profiles?.telegram_username}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Telegram orqali yozish
                    </Button>
                    {listing.profiles?.phone && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleContact("phone")}
                      >
                        <Phone className="mr-2 h-4 w-4" />
                        {listing.profiles.phone}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Safety Tips */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg">Xavfsizlik</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <ul className="space-y-2">
                    <li>• Oldindan to'lov qilmang</li>
                    <li>• Shaxsiy uchrashuvda xarid qiling</li>
                    <li>• Mahsulotni tekshirib ko'ring</li>
                    <li>• Shubhali e'lonlardan ehtiyot bo'ling</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ListingDetail;
