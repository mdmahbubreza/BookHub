import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function slugifySubject(subject: string) {
  return subject.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { books } = await req.json();

    if (!books || books.length === 0) {
      return new Response(
        JSON.stringify({ recommendations: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build a set of user's bookmarked titles+authors to avoid duplicates
    const userSet = new Set<string>();
    const subjectsCount: Record<string, number> = {};
    const authorsSet = new Set<string>();

    for (const b of books) {
      const title = (b.title || "").toString().trim();
      const author = Array.isArray(b.author_name) ? b.author_name[0] : (b.author_name || "");
      userSet.add(`${title.toLowerCase()}|${(author || "").toLowerCase()}`);

      if (Array.isArray(b.subject)) {
        for (const s of b.subject) {
          if (!s) continue;
          const key = s.toString().trim();
          subjectsCount[key] = (subjectsCount[key] || 0) + 1;
        }
      }

      if (Array.isArray(b.author_name)) {
        authorsSet.add(b.author_name[0]);
      } else if (b.author_name) {
        authorsSet.add(b.author_name);
      }
    }

    // Determine top subjects
    const topSubjects = Object.entries(subjectsCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map((s) => s[0]);

    const candidates: any[] = [];

    // Helper to fetch works from a subject
    async function fetchSubjectWorks(subject: string) {
      const slug = slugifySubject(subject);
      const url = `https://openlibrary.org/subjects/${encodeURIComponent(slug)}.json?limit=20`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return data.works || [];
    }

    // Helper to search by author
    async function searchAuthorWorks(author: string) {
      const url = `https://openlibrary.org/search.json?author=${encodeURIComponent(author)}&limit=20`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return data.docs || [];
    }

    // Try subjects first
    for (const subj of topSubjects) {
      const works = await fetchSubjectWorks(subj);
      for (const w of works) {
        candidates.push({
          title: w.title,
          authors: (w.authors || []).map((a: any) => a.name).filter(Boolean),
          year: w.first_publish_year || w.first_publish_year, // keep whatever is available
          subjectUsed: subj,
          key: w.key || w.cover_edition_key || w.title,
          source: "subject",
        });
      }
    }

    // If not enough candidates, try author searches
    if (candidates.length < 10 && authorsSet.size > 0) {
      for (const a of Array.from(authorsSet).slice(0, 5)) {
        const docs = await searchAuthorWorks(a);
        for (const d of docs) {
          candidates.push({
            title: d.title,
            authors: (d.author_name || []).slice(0, 3),
            year: d.first_publish_year || d.first_publish_year,
            subjectUsed: (d.subject && d.subject[0]) || null,
            key: d.key || d.cover_edition_key || d.title,
            source: "author",
          });
        }
      }
    }

    // De-duplicate and filter out user's books
    const seen = new Set<string>();
    const recommendations: any[] = [];
    for (const c of candidates) {
      if (!c || !c.title) continue;
      const auth = Array.isArray(c.authors) && c.authors.length > 0 ? c.authors[0] : "";
      const key = `${(c.title || "").toLowerCase()}|${(auth || "").toLowerCase()}`;
      if (userSet.has(key)) continue;
      if (seen.has(key)) continue;
      seen.add(key);

      const explanationParts: string[] = [];
      if (c.subjectUsed) explanationParts.push(`Matches subject "${c.subjectUsed}"`);
      if (c.source === "author") explanationParts.push(`By an author related to your bookmarks`);
      if (explanationParts.length === 0) explanationParts.push("Shares topics with your bookmarked books");

      recommendations.push({
        title: c.title,
        authors: c.authors || [],
        year: c.year || null,
        key: c.key,
        explanation: explanationParts.join("; "),
        openLibraryUrl: c.key && c.key.startsWith("/") ? `https://openlibrary.org${c.key}` : undefined,
      });

      if (recommendations.length >= 5) break;
    }

    return new Response(
      JSON.stringify({ recommendations }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in recommend-books function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
