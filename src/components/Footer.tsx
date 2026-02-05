import { Link } from "react-router-dom";
import { Send } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <span className="text-lg font-bold text-primary-foreground">P</span>
              </div>
              <span className="text-xl font-bold text-foreground">Parkent.market</span>
            </Link>
            <p className="mt-4 max-w-md text-sm text-muted-foreground">
              Parkent tumani va atrofidagi eng qulay e'lonlar platformasi. Telegram orqali tez va xavfsiz savdo qiling.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <a
                href="https://t.me/parkent_markent"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
              >
                <Send className="h-4 w-4" />
                Telegram
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="mb-4 font-semibold text-foreground">Havolalar</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/listings" className="transition-colors hover:text-foreground">
                  E'lonlar
                </Link>
              </li>
              <li>
                <Link to="/categories" className="transition-colors hover:text-foreground">
                  Kategoriyalar
                </Link>
              </li>
              <li>
                <Link to="/create" className="transition-colors hover:text-foreground">
                  E'lon joylash
                </Link>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="mb-4 font-semibold text-foreground">Ma'lumot</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/about" className="transition-colors hover:text-foreground">
                  Biz haqimizda
                </Link>
              </li>
              <li>
                <Link to="/terms" className="transition-colors hover:text-foreground">
                  Foydalanish shartlari
                </Link>
              </li>
              <li>
                <Link to="/contact" className="transition-colors hover:text-foreground">
                  Bog'lanish
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          <p>© 2024 Parkent.market. Barcha huquqlar himoyalangan.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
