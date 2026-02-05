import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Globe, Send } from "lucide-react";

interface Partner {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  telegram_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
}

const PartnersSection = () => {
  const [partners, setPartners] = useState<Partner[]>([]);

  useEffect(() => {
    const fetchPartners = async () => {
      const { data } = await supabase
        .from("partners")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (data) {
        setPartners(data);
      }
    };

    fetchPartners();
  }, []);

  if (partners.length === 0) return null;

  return (
    <div className="border-b border-border/50 bg-gradient-to-r from-card via-card/95 to-card">
      <div className="container py-2.5">
        <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
          <span className="flex-shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            Hamkorlar
          </span>
          <div className="flex items-center gap-3">
            {partners.map((partner) => (
              <div
                key={partner.id}
                className="group flex flex-shrink-0 items-center gap-2.5 rounded-full border border-border/50 bg-background/50 px-3 py-1.5 transition-all hover:border-primary/30 hover:bg-background hover:shadow-sm"
              >
                {partner.logo_url ? (
                  <img
                    src={partner.logo_url}
                    alt={partner.name}
                    className="h-5 w-5 rounded-full object-cover ring-1 ring-border/50"
                  />
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-[10px] font-bold text-primary-foreground">
                    {partner.name.charAt(0)}
                  </div>
                )}
                <span className="text-sm font-medium text-foreground/90 transition-colors group-hover:text-foreground">
                  {partner.name}
                </span>
                <div className="flex items-center gap-0.5">
                  {partner.telegram_url && (
                    <a
                      href={partner.telegram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full p-1 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Send className="h-3 w-3" />
                    </a>
                  )}
                  {partner.instagram_url && (
                    <a
                      href={partner.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full p-1 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </a>
                  )}
                  {partner.facebook_url && (
                    <a
                      href={partner.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full p-1 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </a>
                  )}
                  {partner.website_url && (
                    <a
                      href={partner.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full p-1 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Globe className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnersSection;
