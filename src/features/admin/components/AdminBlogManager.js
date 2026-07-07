"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/AppModal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, useDialogA11yIds } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { cn } from "@/lib/utils";

const blogPostSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase and URL-friendly."),
  category: z.string().trim().min(1, "Category is required."),
  excerpt: z.string().trim().min(1, "Excerpt is required.").max(250, "Excerpt must stay under 250 characters."),
  author: z.string().trim().min(1, "Author name is required."),
  authorRole: z.string().trim().min(1, "Author role is required."),
  thumbnailType: z.string().trim().min(1, "Thumbnail graphic type is required."),
  content: z.string().trim().min(1, "Content body is required."),
  featured: z.boolean().default(false),
});

const defaultValues = {
  title: "",
  slug: "",
  category: "Latest Data",
  excerpt: "",
  author: "Admin",
  authorRole: "Editor",
  thumbnailType: "wave",
  content: "",
  featured: false,
};

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" className="stroke-current opacity-25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" className="stroke-current" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminBlogManager() {
  const [posts, setPosts] = useState([]);
  const [isHydrating, setIsHydrating] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const slugEditedRef = useRef(false);
  const { titleId, descriptionId } = useDialogA11yIds();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(blogPostSchema),
    defaultValues,
  });

  const watchedTitle = watch("title");
  const watchedSlug = watch("slug");
  const watchedCategory = watch("category");
  const watchedExcerpt = watch("excerpt");
  const watchedContent = watch("content");
  const watchedFeatured = watch("featured");

  async function loadData(showRefreshState = false) {
    if (showRefreshState) {
      setIsRefreshing(true);
    } else {
      setIsHydrating(true);
    }

    try {
      const response = await fetch("/api/blog", { cache: "no-store" });
      const payload = await response.json();
      setPosts(payload.data || []);
    } catch {
      toast.error("Unable to load blog posts.");
    } finally {
      setIsHydrating(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!slugEditedRef.current) {
      setValue("slug", slugify(watchedTitle || ""), { shouldValidate: true });
    }
  }, [setValue, watchedTitle]);

  function openCreateModal() {
    slugEditedRef.current = false;
    setEditingPost(null);
    reset(defaultValues);
    setOpen(true);
  }

  function openEditModal(post) {
    slugEditedRef.current = false;
    setEditingPost(post);
    reset({
      title: post.title,
      slug: post.slug,
      category: post.category,
      excerpt: post.excerpt,
      author: post.author,
      authorRole: post.authorRole || "Editor",
      thumbnailType: post.thumbnailType || "wave",
      content: post.content,
      featured: Boolean(post.featured),
    });
    setOpen(true);
  }

  async function submitPost(values) {
    const endpoint = editingPost ? `/api/blog/${editingPost.slug}` : "/api/blog";
    const method = editingPost ? "PUT" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = await response.json();

    if (!response.ok) {
      toast.error(payload.error || "Unable to save blog post.");
      return;
    }

    await loadData();
    setOpen(false);
    setEditingPost(null);
    slugEditedRef.current = false;
    reset(defaultValues);
    toast.success(editingPost ? "Blog post updated." : "Blog post published.");
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/blog/${deleteTarget.slug}`, { method: "DELETE" });
      const payload = await response.json();

      if (!response.ok) {
        toast.error(payload.error || "Unable to delete blog post.");
        return;
      }

      await loadData();
      setDeleteTarget(null);
      toast.success("Blog post deleted.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-center sm:justify-between p-6">
          <div>
            <CardTitle className="text-base font-bold tracking-tight text-[var(--text)]">Blog Posts Management</CardTitle>
            <CardDescription className="text-xs text-[var(--muted)] mt-0.5">Publish, edit, and manage articles on the public insights platform.</CardDescription>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 w-10 rounded-xl border border-[var(--border)] px-0 text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
              onClick={() => loadData(true)}
              aria-label="Refresh blog posts"
              disabled={isRefreshing}
            >
              <RefreshIcon />
            </Button>
            <Button
              type="button"
              className="rounded-xl font-bold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-sm transition-all duration-200 px-5 h-10 text-xs cursor-pointer"
              onClick={openCreateModal}
            >
              Publish Post
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {posts.length ? (
            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
              <Table>
                <TableHeader className="bg-[var(--surface-soft)]/50">
                  <TableRow className="border-b border-[var(--border)] hover:bg-transparent">
                    <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] px-4">Title</TableHead>
                    <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] px-3">Category</TableHead>
                    <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] px-3">Author</TableHead>
                    <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] px-3">Date</TableHead>
                    <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] px-3">Status</TableHead>
                    <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] px-3">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post.slug} className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--surface-soft)]/30 transition-colors duration-150">
                      {/* Title + Slug */}
                      <TableCell className="px-4 py-3 max-w-[280px]">
                        <p className="text-xs font-bold text-[var(--color-primary)] truncate">{post.title}</p>
                        <p className="mt-0.5 font-mono text-[10px] text-[var(--color-primary)]/60 truncate">/{post.slug}</p>
                      </TableCell>
                      {/* Category badge */}
                      <TableCell className="px-3 py-3">
                        <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--muted)]">
                          {post.category}
                        </span>
                      </TableCell>
                      {/* Author */}
                      <TableCell className="px-3 py-3">
                        <span className="text-xs font-semibold text-[var(--text)]">{post.author}</span>
                      </TableCell>
                      {/* Date */}
                      <TableCell className="px-3 py-3">
                        <span className="text-xs text-[var(--muted)]">{post.date}</span>
                      </TableCell>
                      {/* Status */}
                      <TableCell className="px-3 py-3">
                        <span className={cn(
                          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide",
                          post.featured
                            ? "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                            : "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted)]"
                        )}>
                          {post.featured ? "Featured" : "Standard"}
                        </span>
                      </TableCell>
                      {/* Actions */}
                      <TableCell className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 rounded-lg border border-[var(--border)] p-0 text-[var(--muted)] hover:text-[var(--color-primary)] hover:bg-[var(--surface-soft)] cursor-pointer"
                            onClick={() => openEditModal(post)}
                            aria-label={`Edit ${post.title}`}
                          >
                            <svg viewBox="0 0 24 24" className="h-4 w-4 stroke-current" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                            </svg>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 rounded-lg border border-[var(--border)] p-0 text-[var(--muted)] hover:text-red-600 hover:bg-red-500/5 cursor-pointer"
                            onClick={() => setDeleteTarget(post)}
                            aria-label={`Delete ${post.title}`}
                          >
                            <svg viewBox="0 0 24 24" className="h-4 w-4 stroke-current" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}

          {!posts.length && !isHydrating ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-6 py-10 text-center">
              <h3 className="text-sm font-bold text-[var(--text)]">No blog posts yet</h3>
              <p className="mt-2 text-xs text-[var(--muted)]">Publish your first article to display on the public blog.</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          titleId={titleId}
          descriptionId={descriptionId}
          className="max-h-[calc(100vh-2rem)] max-w-5xl overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-0 shadow-2xl sm:max-h-[calc(100vh-3rem)]"
        >
          <div className="grid gap-0 lg:grid-cols-[380px_1fr] h-[calc(100vh-2rem)] sm:h-[calc(100vh-3rem)] max-h-[820px] overflow-hidden">
            {/* Left Column - Live Preview & Checklist */}
            <div className="border-b border-[var(--border)] bg-gradient-to-br from-[var(--surface-soft)] via-[var(--surface)] to-[var(--surface-soft)]/30 p-6 lg:border-r lg:border-b-0 lg:p-8 flex flex-col justify-between overflow-y-auto">
              <div>
                <DialogHeader className="mb-6">
                  <span className="w-fit inline-flex items-center rounded-full bg-[var(--color-primary)]/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                    Article Composer
                  </span>
                  <DialogTitle id={titleId} className="text-lg font-bold tracking-tight text-[var(--text)] mt-3">
                    {editingPost ? "Update Post" : "Publish Blog Post"}
                  </DialogTitle>
                  <DialogDescription id={descriptionId} className="text-xs text-[var(--muted)] mt-1">
                    Write and publish premium reports directly to the shopping insights portal.
                  </DialogDescription>
                </DialogHeader>

                {/* Live Preview Card */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Live Preview</span>
                  <div className="relative rounded-2xl border border-[var(--border)]/70 bg-[var(--surface)] p-5 shadow-md overflow-hidden">
                    {/* Category tag */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
                        {watchedCategory || "Category"}
                      </span>
                      {watchedFeatured && (
                        <span className="inline-flex items-center rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-2 py-0.5 text-[8px] font-black text-[var(--color-primary)]">
                          ★ FEATURED
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-[var(--text)] leading-snug line-clamp-2 min-h-[40px]">
                      {watchedTitle || <span className="italic text-[var(--muted)]/60 font-normal">Article Title Preview</span>}
                    </h4>
                    <p className="mt-1 font-mono text-[10px] text-[var(--color-primary)]/60">
                      /blog/{watchedSlug || "post-slug"}
                    </p>
                    <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed line-clamp-3 min-h-[48px]">
                      {watchedExcerpt || "Excerpt text summary will display under the title in lists."}
                    </p>
                    <div className="mt-3 pt-3 border-t border-[var(--border)]/50 flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-[var(--muted)]">Published automatically on save</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div className="mt-6 border-t border-[var(--border)] pt-5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Requirements Checklist</span>
                <ul className="mt-3.5 space-y-2.5 text-xs text-[var(--muted)] font-medium">
                  <li className="flex items-center gap-2">
                    <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", watchedTitle ? "bg-purple-500" : "bg-[var(--border)]")} />
                    <span>Article title provided</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", watchedSlug ? "bg-blue-500" : "bg-[var(--border)]")} />
                    <span>URL-safe slug generated</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", watchedExcerpt ? "bg-emerald-500" : "bg-[var(--border)]")} />
                    <span>Excerpt summary written</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", watchedContent ? "bg-amber-500" : "bg-[var(--border)]")} />
                    <span>Article content body filled</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Column - Form */}
            <div className="flex flex-col h-full bg-[var(--surface)] overflow-hidden">
              <form className="flex flex-col h-full overflow-hidden" onSubmit={handleSubmit(submitPost)}>
                <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-5">

                  {/* Title + Slug */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">Title</span>
                      <Input
                        placeholder="E-commerce Coupon Statistics"
                        className="h-11 rounded-xl border-[var(--border)] bg-[var(--surface-soft)] px-4 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
                        {...register("title")}
                      />
                      {errors.title ? <span className="text-xs text-red-500">{errors.title.message}</span> : null}
                    </label>

                    <label className="grid gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">Slug</span>
                      <Input
                        placeholder="e-commerce-coupon-statistics"
                        className="h-11 rounded-xl border-[var(--border)] bg-[var(--surface-soft)] px-4 font-mono text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
                        {...register("slug", {
                          onChange: () => {
                            slugEditedRef.current = true;
                          },
                        })}
                      />
                      {errors.slug ? <span className="text-xs text-red-500">{errors.slug.message}</span> : null}
                    </label>
                  </div>

                  {/* Category + Thumbnail */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">Category</span>
                      <select
                        className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 text-sm text-[var(--text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
                        {...register("category")}
                      >
                        <option value="Latest Data">Latest Data</option>
                        <option value="Store Guides">Store Guides</option>
                        <option value="Best Lists">Best Lists</option>
                        <option value="Deep Dives">Deep Dives</option>
                      </select>
                      {errors.category ? <span className="text-xs text-red-500">{errors.category.message}</span> : null}
                    </label>

                    <label className="grid gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">Thumbnail Illustration</span>
                      <select
                        className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 text-sm text-[var(--text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
                        {...register("thumbnailType")}
                      >
                        <option value="wave">Wave Graph (Data)</option>
                        <option value="map">Region Target Map</option>
                        <option value="stats-circles">Metric Circular Plots</option>
                        <option value="checkmark">Checkmark Icon (Validation)</option>
                        <option value="gear">Spinning Gear Widget (Anatomy)</option>
                        <option value="brands">NIKE vs ADIDAS (Retail comparison)</option>
                        <option value="500k">500,000+ Codes (Tested)</option>
                        <option value="78m">78.8M users (Metric)</option>
                      </select>
                      {errors.thumbnailType ? <span className="text-xs text-red-500">{errors.thumbnailType.message}</span> : null}
                    </label>
                  </div>

                  {/* Author Name + Author Role */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">Author Name</span>
                      <Input
                        placeholder="Alex Sterling"
                        className="h-11 rounded-xl border-[var(--border)] bg-[var(--surface-soft)] px-4 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
                        {...register("author")}
                      />
                      {errors.author ? <span className="text-xs text-red-500">{errors.author.message}</span> : null}
                    </label>

                    <label className="grid gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">Author Role</span>
                      <Input
                        placeholder="Principal Data Analyst"
                        className="h-11 rounded-xl border-[var(--border)] bg-[var(--surface-soft)] px-4 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
                        {...register("authorRole")}
                      />
                      {errors.authorRole ? <span className="text-xs text-red-500">{errors.authorRole.message}</span> : null}
                    </label>
                  </div>

                  {/* Excerpt */}
                  <label className="grid gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">Excerpt Summary</span>
                    <textarea
                      rows={3}
                      maxLength={250}
                      className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
                      placeholder="Summarize the core focus of the article (maximum 250 characters)."
                      {...register("excerpt")}
                    />
                    {errors.excerpt ? <span className="text-xs text-red-500">{errors.excerpt.message}</span> : null}
                  </label>

                  {/* Content Body */}
                  <label className="grid gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">Article Content Body</span>
                    <textarea
                      rows={7}
                      className="min-h-[160px] w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
                      placeholder="Write the paragraphs of the article here. Use line breaks to split paragraphs."
                      {...register("content")}
                    />
                    {errors.content ? <span className="text-xs text-red-500">{errors.content.message}</span> : null}
                  </label>

                  {/* Featured toggle */}
                  <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]/60 p-4">
                    <input
                      type="checkbox"
                      id="featured-checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-[var(--border)] text-[var(--color-primary)] accent-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
                      {...register("featured")}
                    />
                    <label htmlFor="featured-checkbox" className="text-xs font-semibold text-[var(--text)] cursor-pointer select-none leading-relaxed">
                      Highlight as Featured Post
                      <span className="block font-normal text-[var(--muted)] mt-0.5">Displays in the top 2 featured slots on the public blog page.</span>
                    </label>
                  </div>
                </div>

                {/* Sticky Footer */}
                <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] bg-[var(--surface-soft)]/50 px-6 py-4 lg:px-8">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl border-[var(--border)] px-5 h-10 text-xs font-bold text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                    onClick={() => setOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-xl font-bold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-sm transition-all duration-200 px-5 h-10 text-xs cursor-pointer"
                    disabled={isSubmitting}
                    leadingIcon={isSubmitting ? <Spinner /> : null}
                  >
                    {isSubmitting ? "Publishing..." : editingPost ? "Update Post" : "Publish Post"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setDeleteTarget(null);
          }
        }}
        title="Delete Blog Post"
        description={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.title}"? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete Post"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirmed}
        isSubmitting={isDeleting}
      />
    </>
  );
}
