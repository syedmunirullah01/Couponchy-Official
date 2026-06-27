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
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Blog Posts Management</CardTitle>
            <CardDescription>Publish, edit, and manage articles on the public insights platform.</CardDescription>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 w-10 rounded-lg border border-[var(--border)] px-0"
              onClick={() => loadData(true)}
              aria-label="Refresh blog posts"
              disabled={isRefreshing}
            >
              <RefreshIcon />
            </Button>
            <Button type="button" onClick={openCreateModal}>
              Publish Post
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.slug}>
                  <TableCell className="max-w-[280px]">
                    <p className="font-semibold text-[var(--text)] truncate">{post.title}</p>
                    <p className="text-xs text-[var(--muted)] font-mono">/{post.slug}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{post.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-[var(--text)]">{post.author}</p>
                  </TableCell>
                  <TableCell className="text-sm text-[var(--muted)]">{post.date}</TableCell>
                  <TableCell>
                    {post.featured ? (
                      <Badge className="bg-[var(--color-primary)] text-black">Featured</Badge>
                    ) : (
                      <Badge variant="outline">Standard</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => openEditModal(post)}>
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="border border-[var(--border)]"
                        onClick={() => setDeleteTarget(post)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {!posts.length && !isHydrating ? (
            <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-5 py-6 text-sm text-[var(--muted)] text-center">
              No blog posts published yet. Publish your first article to display on the blog.
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          titleId={titleId}
          descriptionId={descriptionId}
          className="max-w-4xl rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-0"
        >
          <div className="grid gap-0 lg:grid-cols-[0.8fr_1.2fr]">
            {/* Sidebar Preview Panel */}
            <div className="border-b border-[var(--border)] bg-[linear-gradient(180deg,var(--surface-soft),var(--surface))] p-6 lg:border-r lg:border-b-0 lg:p-8">
              <DialogHeader className="mb-6">
                <Badge className="w-fit border border-[var(--color-primary)]/20 bg-[var(--surface)] px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-[var(--color-primary)]">
                  Article Composer
                </Badge>
                <DialogTitle id={titleId}>{editingPost ? "Update Post" : "Publish Blog Post"}</DialogTitle>
                <DialogDescription id={descriptionId}>
                  Write and publish premium reports directly to the shopping insights portal.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)]">
                    {watchedCategory}
                  </span>
                  <p className="mt-2 text-base font-bold text-[var(--text)] leading-tight">{watchedTitle || "Article Title Preview"}</p>
                  <p className="mt-1 text-[10px] font-mono text-[var(--muted)]">/blog/{watchedSlug || "post-slug"}</p>
                  {watchedFeatured && (
                    <span className="mt-3 inline-block rounded bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 px-2 py-0.5 text-[8px] font-black text-[var(--color-primary)]">
                      ★ FEATURED
                    </span>
                  )}
                  <p className="mt-4 text-xs text-[var(--muted)] line-clamp-3">
                    {watchedExcerpt || "Excerpt text summary will display under the title in lists."}
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-xs text-[var(--muted)] space-y-2">
                  <p className="font-bold text-[var(--text)]">Publishing Parameters</p>
                  <p>• Date is automatically stamped on publish.</p>
                  <p>• Read time dynamically estimates if left empty.</p>
                </div>
              </div>
            </div>

            {/* Editing Form */}
            <form className="grid gap-5 bg-[var(--surface)] p-6 lg:p-8 max-h-[85vh] overflow-y-auto" onSubmit={handleSubmit(submitPost)}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm text-[var(--muted)]">
                  <span className="font-semibold text-[var(--text)]">Title</span>
                  <Input placeholder="E-commerce Coupon Statistics" className="rounded-lg bg-[var(--surface)]" {...register("title")} />
                  {errors.title ? <span className="text-xs text-[var(--color-primary)]">{errors.title.message}</span> : null}
                </label>

                <label className="grid gap-2 text-sm text-[var(--muted)]">
                  <span className="font-semibold text-[var(--text)]">Slug</span>
                  <Input
                    placeholder="e-commerce-coupon-statistics"
                    className="rounded-lg bg-[var(--surface)]"
                    {...register("slug", {
                      onChange: () => {
                        slugEditedRef.current = true;
                      },
                    })}
                  />
                  {errors.slug ? <span className="text-xs text-[var(--color-primary)]">{errors.slug.message}</span> : null}
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm text-[var(--muted)]">
                  <span className="font-semibold text-[var(--text)]">Category</span>
                  <select
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--color-primary)]"
                    {...register("category")}
                  >
                    <option value="Latest Data">Latest Data</option>
                    <option value="Store Guides">Store Guides</option>
                    <option value="Best Lists">Best Lists</option>
                    <option value="Deep Dives">Deep Dives</option>
                  </select>
                  {errors.category ? <span className="text-xs text-[var(--color-primary)]">{errors.category.message}</span> : null}
                </label>

                <label className="grid gap-2 text-sm text-[var(--muted)]">
                  <span className="font-semibold text-[var(--text)]">Thumbnail Illustration</span>
                  <select
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--color-primary)]"
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
                  {errors.thumbnailType ? <span className="text-xs text-[var(--color-primary)]">{errors.thumbnailType.message}</span> : null}
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm text-[var(--muted)]">
                  <span className="font-semibold text-[var(--text)]">Author Name</span>
                  <Input placeholder="Alex Sterling" className="rounded-lg bg-[var(--surface)]" {...register("author")} />
                  {errors.author ? <span className="text-xs text-[var(--color-primary)]">{errors.author.message}</span> : null}
                </label>

                <label className="grid gap-2 text-sm text-[var(--muted)]">
                  <span className="font-semibold text-[var(--text)]">Author Role</span>
                  <Input placeholder="Principal Data Analyst" className="rounded-lg bg-[var(--surface)]" {...register("authorRole")} />
                  {errors.authorRole ? <span className="text-xs text-[var(--color-primary)]">{errors.authorRole.message}</span> : null}
                </label>
              </div>

              <label className="grid gap-2 text-sm text-[var(--muted)]">
                <span className="font-semibold text-[var(--text)]">Excerpt Summary</span>
                <textarea
                  rows={2}
                  maxLength={250}
                  className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(139, 92, 246,0.16)]"
                  placeholder="Summarize the core focus of the article (maximum 250 characters)."
                  {...register("excerpt")}
                />
                {errors.excerpt ? <span className="text-xs text-[var(--color-primary)]">{errors.excerpt.message}</span> : null}
              </label>

              <label className="grid gap-2 text-sm text-[var(--muted)]">
                <span className="font-semibold text-[var(--text)]">Article Content Body</span>
                <textarea
                  rows={8}
                  className="min-h-[180px] w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:rgba(139, 92, 246,0.16)]"
                  placeholder="Write the paragraphs of the article here. Use line breaks to split paragraphs."
                  {...register("content")}
                />
                {errors.content ? <span className="text-xs text-[var(--color-primary)]">{errors.content.message}</span> : null}
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                <input
                  type="checkbox"
                  id="featured-checkbox"
                  className="h-4.5 w-4.5 rounded border-[var(--border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
                  {...register("featured")}
                />
                <label htmlFor="featured-checkbox" className="text-sm font-semibold text-[var(--text)] cursor-pointer select-none">
                  Highlight as Featured Post (displays in the top 2 slots of the blog page)
                </label>
              </div>

              <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" className="rounded-lg" onClick={() => setOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-lg"
                  disabled={isSubmitting}
                  leadingIcon={isSubmitting ? <Spinner /> : null}
                >
                  {isSubmitting ? "Publishing..." : editingPost ? "Update Post" : "Publish Post"}
                </Button>
              </div>
            </form>
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
