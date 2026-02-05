import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface SearchResult {
  id: string;
  title: string;
  price: number;
  images: string[];
  categories: { name: string } | null;
}

const SearchDropdown = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchListings = async () => {
      if (query.trim().length < 1) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      try {
        const { data } = await supabase
          .from("listings")
          .select("id, title, price, images, categories(name)")
          .eq("status", "active")
          .ilike("title", `%${query}%`)
          .order("is_premium", { ascending: false })
          .limit(6);

        if (data) {
          setResults(data);
          setIsOpen(true);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchListings, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Qidirish..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setIsOpen(true)}
          className="pl-9 pr-9"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-lg">
          {results.map((item) => (
            <Link
              key={item.id}
              to={`/listings/${item.id}`}
              onClick={() => {
                setIsOpen(false);
                setQuery("");
              }}
              className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-accent first:rounded-t-lg last:rounded-b-lg"
            >
              <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                <img
                  src={item.images?.[0] || "/placeholder.svg"}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-foreground">
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.categories?.name || "Boshqa"}
                </p>
              </div>
              <p className="flex-shrink-0 text-sm font-semibold text-primary">
                {item.price.toLocaleString("uz-UZ")} so'm
              </p>
            </Link>
          ))}
          <Link
            to={`/listings?search=${encodeURIComponent(query)}`}
            onClick={() => {
              setIsOpen(false);
              setQuery("");
            }}
            className="block border-t border-border px-3 py-2 text-center text-sm text-primary hover:bg-accent"
          >
            Barchasini ko'rish →
          </Link>
        </div>
      )}

      {isOpen && query.trim() && results.length === 0 && !loading && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-lg border border-border bg-card p-4 text-center shadow-lg">
          <p className="text-sm text-muted-foreground">
            "{query}" bo'yicha hech narsa topilmadi
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchDropdown;
