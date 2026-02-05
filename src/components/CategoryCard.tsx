import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface CategoryCardProps {
  name: string;
  icon: LucideIcon;
  count: number;
  slug: string;
}

const CategoryCard = ({ name, icon: Icon, count, slug }: CategoryCardProps) => {
  return (
    <Link to={`/categories/${slug}`}>
      <Card className="group cursor-pointer transition-all duration-300 hover:shadow-md hover:ring-1 hover:ring-primary/30">
        <CardContent className="flex flex-col items-center p-6 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <Icon className="h-7 w-7" />
          </div>
          <h3 className="mb-1 font-semibold text-foreground">{name}</h3>
          <p className="text-sm text-muted-foreground">{count} ta e'lon</p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default CategoryCard;
