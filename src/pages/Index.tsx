import { useNavigate } from "react-router-dom";
import { BookOpen, Search, Download, BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <BookOpen className="h-20 w-20 text-primary mx-auto mb-6" />
          <h1 className="text-6xl font-serif font-bold text-primary mb-4">BookHub</h1>
          <p className="text-xl text-muted-foreground mb-8">Your Literary Gateway to Millions of Books</p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/books")}>
              Explore Books
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <Search className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Powerful Search</CardTitle>
              <CardDescription>
                Search millions of books by author from the Open Library database
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Download className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Export Results</CardTitle>
              <CardDescription>
                Download your search results in CSV format for offline use
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BookMarked className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Rich Information</CardTitle>
              <CardDescription>
                Access detailed book data including authors, publication years, and ISBNs
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
