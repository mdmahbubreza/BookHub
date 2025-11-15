import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Book, Calendar, User, Hash, Globe, BookmarkIcon, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface BookNote {
  note: string;
  rating: number;
}

interface BookDetailsModalProps {
  book: {
    key: string;
    title: string;
    author_name?: string[];
    first_publish_year?: number;
    isbn?: string[];
    publisher?: string[];
    subject?: string[];
    language?: string[];
    number_of_pages_median?: number;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  bookNote?: BookNote;
  onSaveNote: (note: string, rating: number) => void;
}

const BookDetailsModal = ({ 
  book, 
  open, 
  onOpenChange,
  isBookmarked,
  onToggleBookmark,
  bookNote,
  onSaveNote
}: BookDetailsModalProps) => {
  const [note, setNote] = useState(bookNote?.note || "");
  const [rating, setRating] = useState(bookNote?.rating || 0);
  const [isEditingNote, setIsEditingNote] = useState(false);

  if (!book) return null;

  const buildCoverUrl = (key: string, value: string | number, size: "S" | "M" | "L" = "L") => {
    return `https://covers.openlibrary.org/b/${key}/${encodeURIComponent(String(value))}-${size}.jpg?default=false`;
  };

  const getCoverUrl = (b: any) => {
    // Try common keys in order: ISBN, OLID (cover_edition_key), Cover ID (cover_i)
    if (b?.isbn && Array.isArray(b.isbn) && b.isbn[0]) return buildCoverUrl("isbn", b.isbn[0], "L");
    if (b?.cover_edition_key) return buildCoverUrl("olid", b.cover_edition_key, "L");
    if (b?.cover_i) return buildCoverUrl("id", b.cover_i, "L");
    // Fallbacks: try using OLID if present on the record
    if (b?.olid) return buildCoverUrl("olid", b.olid, "L");
    return null;
  };

  const getThumbUrl = (b: any) => {
    if (b?.isbn && Array.isArray(b.isbn) && b.isbn[0]) return buildCoverUrl("isbn", b.isbn[0], "M");
    if (b?.cover_edition_key) return buildCoverUrl("olid", b.cover_edition_key, "M");
    if (b?.cover_i) return buildCoverUrl("id", b.cover_i, "M");
    if (b?.olid) return buildCoverUrl("olid", b.olid, "M");
    return null;
  };

  const handleSaveNote = () => {
    onSaveNote(note, rating);
    setIsEditingNote(false);
  };

  const coverUrl = getCoverUrl(book as any);
  const thumbUrl = getThumbUrl(book as any);

  // No external rating displayed here; show ISBN below if available

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0 bg-card">
        <ScrollArea className="max-h-[85vh]">
          <div className="p-6">
            <DialogHeader>
              <div className="flex items-start justify-between gap-4">
                <DialogTitle className="text-2xl font-serif text-primary pr-8 flex items-center gap-4">
                  {thumbUrl && (
                    <img
                      src={thumbUrl}
                      alt={`${book.title} cover`}
                      className="h-12 w-8 rounded-md object-cover border"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                  <span>{book.title}</span>
                </DialogTitle>
                <Button
                  variant={isBookmarked ? "default" : "outline"}
                  size="sm"
                  onClick={onToggleBookmark}
                  className="shrink-0"
                >
                  <BookmarkIcon className={`h-4 w-4 mr-2 ${isBookmarked ? 'fill-current' : ''}`} />
                  {isBookmarked ? "Bookmarked" : "Bookmark"}
                </Button>
              </div>
            </DialogHeader>

            <div className="mt-6 space-y-6">
              {coverUrl && (
                <div className="flex justify-center">
                  <img 
                    src={coverUrl} 
                    alt={book.title}
                    className="rounded-lg shadow-lg max-h-64 object-cover border-2 border-library-shelf"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {isBookmarked && (
                <div className="border border-border rounded-lg p-4 bg-library-parchment">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-foreground">My Notes & Rating</h3>
                    {!isEditingNote && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setIsEditingNote(true)}
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Rating</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => isEditingNote && setRating(star)}
                            disabled={!isEditingNote}
                            className={`transition-colors ${isEditingNote ? 'cursor-pointer' : 'cursor-default'}`}
                          >
                            <Star
                              className={`h-5 w-5 ${
                                star <= rating
                                  ? 'fill-library-gold text-library-gold'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {isEditingNote ? (
                      <>
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Notes</p>
                          <Textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Add your thoughts about this book..."
                            className="min-h-24"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleSaveNote} size="sm">
                            Save
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setNote(bookNote?.note || "");
                              setRating(bookNote?.rating || 0);
                              setIsEditingNote(false);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Notes</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {note || "No notes yet. Click Edit to add your thoughts."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid gap-4">
                {book.author_name && book.author_name.length > 0 && (
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Authors</p>
                      <p className="text-foreground">{book.author_name.join(", ")}</p>
                    </div>
                  </div>
                )}

                {book.first_publish_year && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">First Published</p>
                      <p className="text-foreground">{book.first_publish_year}</p>
                    </div>
                  </div>
                )}

                {book.isbn && book.isbn.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Hash className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">ISBN</p>
                      <p className="text-foreground font-mono text-sm">{book.isbn[0]}</p>
                    </div>
                  </div>
                )}

                {book.publisher && book.publisher.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Book className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Publishers</p>
                      <p className="text-foreground">{book.publisher.slice(0, 3).join(", ")}</p>
                      {book.publisher.length > 3 && (
                        <p className="text-sm text-muted-foreground">+ {book.publisher.length - 3} more</p>
                      )}
                    </div>
                  </div>
                )}

                {book.number_of_pages_median && (
                  <div className="flex items-start gap-3">
                    <Book className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pages</p>
                      <p className="text-foreground">{book.number_of_pages_median}</p>
                    </div>
                  </div>
                )}

                {book.language && book.language.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Languages</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {book.language.slice(0, 5).map((lang, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {lang.toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {book.subject && book.subject.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Book className="h-5 w-5 text-primary mt-0.5" />
                    <div className="w-full">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Subjects</p>
                      <div className="flex flex-wrap gap-2">
                        {book.subject.slice(0, 10).map((subject, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {subject}
                          </Badge>
                        ))}
                        {book.subject.length > 10 && (
                          <Badge variant="secondary" className="text-xs">
                            +{book.subject.length - 10} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default BookDetailsModal;
