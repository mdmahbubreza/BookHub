import { useState, useEffect, useCallback } from "react";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Search, Download, ChevronLeft, ChevronRight, ArrowUpDown, BookmarkIcon, Filter, X, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BookDetailsModal from "@/components/BookDetailsModal";
import { supabase } from "@/integrations/supabase/client";

interface Book {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  isbn?: string[];
  publisher?: string[];
  subject?: string[];
  language?: string[];
  number_of_pages_median?: number;
}

interface BookNote {
  note: string;
  rating: number;
}

type SortField = "title" | "author_name" | "first_publish_year";
type SortOrder = "asc" | "desc";

const Books = () => {
  const { toast } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalResults, setTotalResults] = useState(0);
  const [sortField, setSortField] = useState<SortField>("title");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [viewMode, setViewMode] = useState<"all" | "bookmarks" | "recommendations">("all");
  const [bookNotes, setBookNotes] = useState<Record<string, BookNote>>({});
  const [recommendations, setRecommendations] = useState("");
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  // Load bookmarks and notes from localStorage
  useEffect(() => {
    const savedBookmarks = localStorage.getItem("bookhub-bookmarks");
    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks));
    }
    
    const savedNotes = localStorage.getItem("bookhub-notes");
    if (savedNotes) {
      setBookNotes(JSON.parse(savedNotes));
    }
  }, []);

  // Debounced search as user types
  useEffect(() => {
    if (!searchQuery.trim()) return;

    const timer = setTimeout(() => {
      searchBooks();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchBooks();
    }
  }, [currentPage, itemsPerPage]);

  const searchBooks = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search Required",
        description: "Please enter a book title or author to search",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const fields = "key,title,author_name,first_publish_year,isbn,edition_key,cover_edition_key,cover_i,editions";
      const q = `title:\"${searchQuery}\" OR author:\"${searchQuery}\"`;
      let url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&fields=${encodeURIComponent(fields)}&limit=${itemsPerPage}&offset=${offset}`;
      if (subjectFilter) url += `&subject=${encodeURIComponent(subjectFilter)}`;

      const resp = await fetch(url);
      const data = resp.ok ? await resp.json() : { docs: [], numFound: 0 };

      // Use single-query results and dedupe by key
      const combined = [...(data.docs || [])];
      const seen = new Set<string>();
      const filteredBooks: Book[] = [];

      for (const b of combined) {
        const key = b.key || `${b.title}|${(b.author_name && b.author_name[0]) || ""}`;
        if (seen.has(key)) continue;
        seen.add(key);

        // Apply year filter if present
        if (yearFrom || yearTo) {
          if (!b.first_publish_year) continue;
          const year = b.first_publish_year;
          if (yearFrom && year < parseInt(yearFrom)) continue;
          if (yearTo && year > parseInt(yearTo)) continue;
        }

        filteredBooks.push(b as Book);
      }

      setBooks(filteredBooks);
      setTotalResults(filteredBooks.length);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch books. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBookmark = (bookKey: string) => {
    const newBookmarks = bookmarks.includes(bookKey)
      ? bookmarks.filter((k) => k !== bookKey)
      : [...bookmarks, bookKey];
    
    setBookmarks(newBookmarks);
    localStorage.setItem("bookhub-bookmarks", JSON.stringify(newBookmarks));
    
    toast({
      title: bookmarks.includes(bookKey) ? "Bookmark Removed" : "Bookmark Added",
      description: bookmarks.includes(bookKey) 
        ? "Book removed from your bookmarks" 
        : "Book added to your bookmarks",
    });
  };

  const saveBookNote = (bookKey: string, note: string, rating: number) => {
    const newNotes = { ...bookNotes, [bookKey]: { note, rating } };
    setBookNotes(newNotes);
    localStorage.setItem("bookhub-notes", JSON.stringify(newNotes));
    
    toast({
      title: "Note Saved",
      description: "Your note and rating have been saved",
    });
  };

  const getRecommendations = async () => {
    if (bookmarks.length === 0) {
      toast({
        title: "No Bookmarks",
        description: "Bookmark some books first to get personalized recommendations!",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingRecommendations(true);
    setViewMode("recommendations");
    
    try {
      const bookmarkedBooks = books.filter(book => bookmarks.includes(book.key));
      
      const { data, error } = await supabase.functions.invoke("recommend-books", {
        body: { books: bookmarkedBooks },
      });

      if (error) {
        if (error.message.includes("429")) {
          toast({
            title: "Rate Limit",
            description: "Too many requests. Please try again in a moment.",
            variant: "destructive",
          });
        } else if (error.message.includes("402")) {
          toast({
            title: "AI Usage Limit",
            description: "AI usage limit reached. Please add credits to continue.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      setRecommendations(data.recommendations);
    } catch (error) {
      console.error("Error getting recommendations:", error);
      toast({
        title: "Error",
        description: "Failed to generate recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const getCoverUrl = (b: any) => {
    const isbn = getFirstISBN(b);
    if (isbn) return `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false`;
    if (b?.cover_edition_key) return `https://covers.openlibrary.org/b/olid/${b.cover_edition_key}-M.jpg?default=false`;
    if (b?.cover_i) return `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg?default=false`;
    return null;
  };

  // Try to get a usable ISBN from the search doc. Falls back to edition data when necessary.
  const getFirstISBN = (b: any) => {
    if (!b) return null;
    if (Array.isArray(b.isbn) && b.isbn.length > 0) return b.isbn[0];
    if (b.editions && b.editions.docs && Array.isArray(b.editions.docs)) {
      for (const ed of b.editions.docs) {
        if (ed && Array.isArray(ed.isbn) && ed.isbn.length > 0) return ed.isbn[0];
      }
    }
    return null;
  };

  // Render recommendation text converting patterns like
  // **"Title" by Author:**  ->  <strong>Title</strong> by <em>Author</em>:
  const renderRecommendations = (text: string) => {
    if (!text) return null;
    const nodes: React.ReactNode[] = [];
    // Helper to remove stray ** or **" fragments from surrounding text
    const cleanSegment = (s: string) => s.replace(/\*{1,2}\s*"?/g, "").replace(/"?\s*\*{1,2}/g, "");

    // Match optional surrounding * or ** (with optional space), optional quotes around title
    const re = /(?:\*{1,2}\s*)?["“]?([^"“”\n]+?)["”]?\s+by\s+([^:\n]+):\s*(?:\*{1,2})?/gi;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let idx = 0;
    while ((match = re.exec(text)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        const seg = text.slice(lastIndex, matchIndex);
        nodes.push(cleanSegment(seg));
      }
      const title = match[1].trim();
      const author = match[2].trim();
      nodes.push(<strong key={`title-${idx}`}>{title}</strong>);
      nodes.push(" ");
      nodes.push(<em key={`author-${idx}`}>{author}</em>);
      nodes.push(":");
      lastIndex = re.lastIndex;
      idx++;
    }
    if (lastIndex < text.length) {
      const seg = text.slice(lastIndex);
      nodes.push(cleanSegment(seg));
    }
    return <div className="whitespace-pre-wrap text-foreground">{nodes}</div>;
  };

  const clearFilters = () => {
    setSubjectFilter("");
    setYearFrom("");
    setYearTo("");
  };

  const hasActiveFilters = subjectFilter || yearFrom || yearTo;

  const displayedBooks = viewMode === "bookmarks" 
    ? books.filter(book => bookmarks.includes(book.key))
    : viewMode === "all"
    ? books
    : [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    searchBooks();
  };

  const sortBooks = (field: SortField) => {
    const newOrder = sortField === field && sortOrder === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortOrder(newOrder);

    const sorted = [...books].sort((a, b) => {
      let aVal: any = a[field];
      let bVal: any = b[field];

      if (field === "author_name") {
        aVal = a.author_name?.[0] || "";
        bVal = b.author_name?.[0] || "";
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return newOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return newOrder === "asc" ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });

    setBooks(sorted);
  };

  const downloadCSV = () => {
    const headers = ["Title", "Author", "First Published", "ISBN"];
    const rows = books.map(book => [
      book.title,
      book.author_name?.join(", ") || "Unknown",
      book.first_publish_year || "Unknown",
      getFirstISBN(book) || "N/A",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookhub-${searchQuery}-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "CSV file downloaded successfully",
    });
  };

  const totalPages = Math.ceil(totalResults / itemsPerPage);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-serif font-bold text-primary mb-2">Discover Books</h1>
          <p className="text-muted-foreground">Search and explore millions of books from Open Library</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search by author name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                    !
                  </Badge>
                )}
              </Button>
              <Button type="submit" disabled={isLoading}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>

              {showFilters && (
              <div className="p-4 border border-border rounded-lg bg-library-parchment space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-foreground">Advanced Filters</h3>
                  {hasActiveFilters && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={clearFilters}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Subject
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., Fiction, Science..."
                      value={subjectFilter}
                      onChange={(e) => setSubjectFilter(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Year From
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g., 1950"
                      value={yearFrom}
                      onChange={(e) => setYearFrom(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Year To
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g., 2024"
                      value={yearTo}
                      onChange={(e) => setYearTo(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </form>
        </Card>

        {books.length > 0 && (
          <>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "all" | "bookmarks" | "recommendations")}>
              <div className="flex justify-between items-center">
                <TabsList className="flex gap-2 overflow-auto">
                  <TabsTrigger value="all">All Results ({totalResults})</TabsTrigger>
                  <TabsTrigger value="bookmarks">
                    <BookmarkIcon className="h-4 w-4 mr-2" />
                    Bookmarks ({bookmarks.length})
                  </TabsTrigger>
                  <TabsTrigger value="recommendations">
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Recommendations
                  </TabsTrigger>
                  </TabsList>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    Showing {displayedBooks.length} books
                  </span>
                  <Select value={itemsPerPage.toString()} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 per page</SelectItem>
                      <SelectItem value="50">50 per page</SelectItem>
                      <SelectItem value="100">100 per page</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={downloadCSV} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV
                  </Button>
                </div>
              </div>

              <TabsContent value="all" className="mt-4">
                <Card>
                  {/* Desktop table */}
                  <div className="hidden md:block">
                    <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="cursor-pointer" onClick={() => sortBooks("title")}>
                          <div className="flex items-center gap-2">
                            Title
                            <ArrowUpDown className="h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => sortBooks("author_name")}>
                          <div className="flex items-center gap-2">
                            Author
                            <ArrowUpDown className="h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => sortBooks("first_publish_year")}>
                          <div className="flex items-center gap-2">
                            First Published
                            <ArrowUpDown className="h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead>ISBN</TableHead>
                        <TableHead className="w-24"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        Array.from({ length: itemsPerPage }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                          </TableRow>
                        ))
                      ) : (
                        displayedBooks.map((book) => {
                          const coverUrl = getCoverUrl(book);
                          const isBookmarked = bookmarks.includes(book.key);
                          
                          return (
                            <TableRow 
                              key={book.key}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => setSelectedBook(book)}
                            >
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-3">
                                  {coverUrl ? (
                                    <img 
                                      src={coverUrl} 
                                      alt={book.title}
                                      className="h-12 w-8 object-cover rounded border border-border"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="h-12 w-8 bg-muted rounded border border-border flex items-center justify-center">
                                      <BookmarkIcon className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                  )}
                                  <span>{book.title}</span>
                                </div>
                              </TableCell>
                              <TableCell>{book.author_name?.join(", ") || "Unknown"}</TableCell>
                              <TableCell>{book.first_publish_year || "Unknown"}</TableCell>
                              <TableCell className="font-mono text-sm">{getFirstISBN(book) || "N/A"}</TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant={isBookmarked ? "default" : "ghost"}
                                  size="sm"
                                  onClick={() => toggleBookmark(book.key)}
                                  className="h-8 w-8 p-0"
                                >
                                  <BookmarkIcon className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                    </Table>
                  </div>

                  {/* Mobile list */}
                  <div className="md:hidden space-y-3">
                    {isLoading ? (
                      Array.from({ length: itemsPerPage }).map((_, i) => (
                        <Card key={i} className="p-3">
                          <div className="animate-pulse flex items-center gap-3">
                            <div className="h-12 w-8 bg-muted rounded" />
                            <div className="flex-1">
                              <div className="h-4 bg-muted rounded mb-2 w-3/4" />
                              <div className="h-3 bg-muted rounded w-1/2" />
                            </div>
                          </div>
                        </Card>
                      ))
                    ) : (
                      displayedBooks.map((book) => {
                        const coverUrl = getCoverUrl(book);
                        const isBookmarked = bookmarks.includes(book.key);
                        return (
                          <Card key={book.key} className="p-3" onClick={() => setSelectedBook(book)}>
                            <div className="flex items-center gap-3">
                              {coverUrl ? (
                                <img src={coverUrl} alt={book.title} className="h-12 w-8 object-cover rounded border border-border" />
                              ) : (
                                <div className="h-12 w-8 bg-muted rounded border border-border flex items-center justify-center">
                                  <BookmarkIcon className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="font-medium">{book.title}</div>
                                <div className="text-sm text-muted-foreground">{book.author_name?.join(", ") || "Unknown"}</div>
                                <div className="text-xs text-muted-foreground mt-1">{book.first_publish_year || "Unknown"} • {getFirstISBN(book) || "N/A"}</div>
                              </div>
                              <div onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant={isBookmarked ? "default" : "ghost"}
                                  size="sm"
                                  onClick={() => toggleBookmark(book.key)}
                                  className="h-8 w-8 p-0"
                                >
                                  <BookmarkIcon className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="bookmarks" className="mt-4">
                {bookmarks.length === 0 ? (
                  <Card className="p-12 text-center">
                    <BookmarkIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No bookmarks yet. Start bookmarking books!</p>
                  </Card>
                ) : (
                  <Card>
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Author</TableHead>
                            <TableHead>First Published</TableHead>
                            <TableHead>ISBN</TableHead>
                            <TableHead className="w-24"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {displayedBooks.map((book) => {
                            const coverUrl = getCoverUrl(book);
                            const isBookmarked = bookmarks.includes(book.key);

                            return (
                              <TableRow 
                                key={book.key}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => setSelectedBook(book)}
                              >
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-3">
                                    {coverUrl ? (
                                      <img 
                                        src={coverUrl} 
                                        alt={book.title}
                                        className="h-12 w-8 object-cover rounded border border-border"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <div className="h-12 w-8 bg-muted rounded border border-border flex items-center justify-center">
                                        <BookmarkIcon className="h-5 w-5 text-muted-foreground" />
                                      </div>
                                    )}
                                    <span>{book.title}</span>
                                  </div>
                                </TableCell>
                                <TableCell>{book.author_name?.join(", ") || "Unknown"}</TableCell>
                                <TableCell>{book.first_publish_year || "Unknown"}</TableCell>
                                <TableCell className="font-mono text-sm">{getFirstISBN(book) || "N/A"}</TableCell>
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant={isBookmarked ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => toggleBookmark(book.key)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <BookmarkIcon className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="md:hidden space-y-3">
                      {displayedBooks.map((book) => {
                        const coverUrl = getCoverUrl(book);
                        const isBookmarked = bookmarks.includes(book.key);

                        return (
                          <Card key={book.key} className="p-3" onClick={() => setSelectedBook(book)}>
                            <div className="flex items-center gap-3">
                              {coverUrl ? (
                                <img src={coverUrl} alt={book.title} className="h-12 w-8 object-cover rounded border border-border" />
                              ) : (
                                <div className="h-12 w-8 bg-muted rounded border border-border flex items-center justify-center">
                                  <BookmarkIcon className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="font-medium">{book.title}</div>
                                <div className="text-sm text-muted-foreground">{book.author_name?.join(", ") || "Unknown"}</div>
                                <div className="text-xs text-muted-foreground mt-1">{book.first_publish_year || "Unknown"} • {getFirstISBN(book) || "N/A"}</div>
                              </div>
                              <div onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant={isBookmarked ? "default" : "ghost"}
                                  size="sm"
                                  onClick={() => toggleBookmark(book.key)}
                                  className="h-8 w-8 p-0"
                                >
                                  <BookmarkIcon className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="recommendations" className="mt-4">
                <Card className="p-6">
                  {!recommendations && !isLoadingRecommendations && (
                    <div className="text-center py-12">
                      <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Get AI-Powered Recommendations</h3>
                      <p className="text-muted-foreground mb-6">
                        Based on your bookmarked books, I'll suggest similar books you might enjoy
                      </p>
                      <Button onClick={getRecommendations} disabled={bookmarks.length === 0}>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Recommendations
                      </Button>
                    </div>
                  )}

                  {isLoadingRecommendations && (
                    <div className="text-center py-12">
                      <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
                      <p className="text-muted-foreground">
                        Analyzing your reading preferences...
                      </p>
                    </div>
                  )}

                  {recommendations && !isLoadingRecommendations && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Your Personalized Recommendations</h3>
                        <Button onClick={getRecommendations} variant="outline" size="sm">
                          <Sparkles className="h-4 w-4 mr-2" />
                          Refresh
                        </Button>
                      </div>

                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        {renderRecommendations(recommendations)}
                      </div>
                    </div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 px-4">
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {!isLoading && books.length === 0 && searchQuery && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No books found. Try a different author name.</p>
          </Card>
        )}
      </div>

      <BookDetailsModal
        book={selectedBook}
        open={!!selectedBook}
        onOpenChange={(open) => !open && setSelectedBook(null)}
        isBookmarked={selectedBook ? bookmarks.includes(selectedBook.key) : false}
        onToggleBookmark={() => selectedBook && toggleBookmark(selectedBook.key)}
        bookNote={selectedBook ? bookNotes[selectedBook.key] : undefined}
        onSaveNote={(note, rating) => selectedBook && saveBookNote(selectedBook.key, note, rating)}
      />
    </Layout>
  );
};

export default Books;
