import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock, Crown } from "lucide-react";
import { Link } from "react-router-dom";

interface ListingCardProps {
  id: string;
  title: string;
  price: number;
  location: string;
  imageUrl: string;
  createdAt: string;
  isPremium?: boolean;
  category: string;
}

const ListingCard = ({
  id,
  title,
  price,
  location,
  imageUrl,
  createdAt,
  isPremium = false,
  category,
}: ListingCardProps) => {
  return (
    <Link to={`/listings/${id}`}>
      <Card className={`group overflow-hidden transition-all duration-300 hover:shadow-lg ${
        isPremium 
          ? "ring-2 ring-primary bg-gradient-to-br from-accent via-accent/80 to-primary/10 shadow-md" 
          : "hover:ring-1 hover:ring-border"
      }`}>
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {isPremium && (
            <div className="absolute left-2 top-2">
              <Badge className="bg-primary text-primary-foreground gap-1 shadow-lg">
                <Crown className="h-3 w-3" />
                Premium
              </Badge>
            </div>
          )}
          <Badge variant="secondary" className="absolute right-2 top-2">
            {category}
          </Badge>
        </div>
        <CardContent className={`p-4 ${isPremium ? "bg-gradient-to-b from-transparent to-primary/5" : ""}`}>
          <h3 className={`mb-2 line-clamp-2 font-semibold transition-colors ${
            isPremium 
              ? "text-primary group-hover:text-primary/80" 
              : "text-foreground group-hover:text-primary"
          }`}>
            {title}
          </h3>
          <p className={`mb-3 text-lg font-bold ${isPremium ? "text-primary" : "text-primary"}`}>
            {price.toLocaleString("uz-UZ")} so'm
          </p>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate">{location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{createdAt}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ListingCard;
