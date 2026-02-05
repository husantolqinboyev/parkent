import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Check, X, Crown, User, Clock, MapPin, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface PendingListing {
  id: string;
  title: string;
  description: string | null;
  price: number;
  location: string | null;
  images: string[];
  created_at: string;
  profiles: { display_name: string | null; telegram_username: string | null } | null;
  categories: { name: string } | null;
}

interface PendingListingCardProps {
  listing: PendingListing;
  onApprove: (id: string, isPremium?: boolean) => void;
  onReject: (id: string) => void;
  isLoading: boolean;
}

const PendingListingCard = ({ listing, onApprove, onReject, isLoading }: PendingListingCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const images = listing.images || [];
  const hasMultipleImages = images.length > 1;

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Image Gallery */}
        <div className="relative aspect-video bg-muted">
          {images.length > 0 ? (
            <>
              <img
                src={images[currentImageIndex]}
                alt={listing.title}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
              {hasMultipleImages && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {images.map((_, idx) => (
                      <span
                        key={idx}
                        className={`h-2 w-2 rounded-full ${
                          idx === currentImageIndex ? "bg-white" : "bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
              <Badge className="absolute left-2 top-2 bg-background/80 text-foreground">
                {images.length} ta rasm
              </Badge>
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-muted-foreground">Rasm yo'q</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground line-clamp-2">{listing.title}</h3>
            <Badge variant="secondary">{listing.categories?.name}</Badge>
          </div>

          <div className="text-lg font-bold text-primary">
            {listing.price.toLocaleString()} so'm
          </div>

          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {listing.profiles?.display_name || listing.profiles?.telegram_username || "Noma'lum"}
            </span>
            {listing.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {listing.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {new Date(listing.created_at).toLocaleDateString("uz-UZ")}
            </span>
          </div>

          {/* Description preview */}
          {listing.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{listing.description}</p>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="mr-1 h-4 w-4" />
                  Batafsil
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{listing.title}</DialogTitle>
                  <DialogDescription>E'lon tafsilotlari</DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* All Images */}
                  {images.length > 0 && (
                    <div className="grid gap-2 grid-cols-2">
                      {images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Rasm ${idx + 1}`}
                          className="w-full aspect-video object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg";
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Details */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Narx</h4>
                      <p className="text-lg font-bold text-primary">
                        {listing.price.toLocaleString()} so'm
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Kategoriya</h4>
                      <p>{listing.categories?.name || "—"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Joylashuv</h4>
                      <p>{listing.location || "Ko'rsatilmagan"}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Foydalanuvchi</h4>
                      <p>
                        {listing.profiles?.display_name || "—"}
                        {listing.profiles?.telegram_username && (
                          <span className="text-muted-foreground ml-1">
                            (@{listing.profiles.telegram_username})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {listing.description && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Tavsif</h4>
                      <p className="whitespace-pre-wrap">{listing.description}</p>
                    </div>
                  )}

                  {/* Action buttons in dialog */}
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                      onClick={() => {
                        onApprove(listing.id);
                        setDetailsOpen(false);
                      }}
                      disabled={isLoading}
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Tasdiqlash
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        onApprove(listing.id, true);
                        setDetailsOpen(false);
                      }}
                      disabled={isLoading}
                    >
                      <Crown className="mr-1 h-4 w-4" />
                      Premium
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        onReject(listing.id);
                        setDetailsOpen(false);
                      }}
                      disabled={isLoading}
                    >
                      <X className="mr-1 h-4 w-4" />
                      Rad etish
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              size="sm"
              onClick={() => onApprove(listing.id)}
              disabled={isLoading}
            >
              <Check className="mr-1 h-4 w-4" />
              Tasdiqlash
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onApprove(listing.id, true)}
              disabled={isLoading}
            >
              <Crown className="mr-1 h-4 w-4" />
              Premium
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onReject(listing.id)}
              disabled={isLoading}
            >
              <X className="mr-1 h-4 w-4" />
              Rad
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PendingListingCard;
