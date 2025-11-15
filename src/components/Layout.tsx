import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2 group">
                <BookOpen className="h-6 w-6 md:h-8 md:w-8 text-primary transition-transform group-hover:scale-110" />
                <div>
                  <h1 className="text-xl md:text-2xl font-serif font-bold text-primary">BookHub</h1>
                  <p className="hidden md:block text-xs text-muted-foreground">Your Literary Gateway</p>
                </div>
              </Link>
              <ThemeToggle />
            </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
      <footer className="border-t border-border mt-auto py-6 bg-card">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            <a
              href="https://github.com/sponsors/mdmahbubreza"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Sponsor the project
            </a>
            {" • "}
            <a
              href="https://github.com/mdmahbubreza/BookHub"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              View on GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
