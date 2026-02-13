import { Link, useLocation } from "react-router-dom";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b bg-primary text-primary-foreground">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <Package className="h-6 w-6 text-secondary" />
          <span>World Option</span>
        </Link>

        <div className="flex gap-6 text-sm font-medium">
          <Link
            to="/"
            className={cn(
              "transition-colors hover:text-secondary",
              pathname === "/" && "text-secondary"
            )}
          >
            Calculator
          </Link>
          <Link
            to="/quotes"
            className={cn(
              "transition-colors hover:text-secondary",
              pathname === "/quotes" && "text-secondary"
            )}
          >
            Quotes
          </Link>
          <Link
            to="/admin"
            className={cn(
              "transition-colors hover:text-secondary",
              pathname === "/admin" && "text-secondary"
            )}
          >
            Admin
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
