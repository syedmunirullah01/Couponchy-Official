import BreadcrumbBar from "./BreadcrumbBar";
import CategoryFilter from "./CategoryFilter";
import Pagination from "./Pagination";
import StoreGrid from "./StoreGrid";

export default function StoreDirectoryPage({ breadcrumbItems, categories, stores, searchValue }) {
  const trimmedSearch = String(searchValue || "").trim();
  const hasSearch = Boolean(trimmedSearch);

  return (
    <>
      <BreadcrumbBar breadcrumbItems={breadcrumbItems} />
      <div className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-5xl font-black uppercase tracking-[-0.05em] text-white sm:text-6xl">Store Directory</h1>
          <div className="mt-4 h-1.5 w-20 rounded-full bg-[var(--accent)]" />
          {hasSearch ? (
            <div className="mt-6 rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-5 py-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Search Results</p>
              <p className="mt-2 text-base text-white">
                Results for <span className="font-bold">&quot;{trimmedSearch}&quot;</span>
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          {categories.length ? <CategoryFilter categories={categories} /> : null}
          <div className="flex-1">
            {stores.length ? (
              <>
                <StoreGrid stores={stores} />
                <Pagination />
              </>
            ) : (
              <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-10 text-center">
                <p className="text-xl font-semibold text-[var(--text)]">
                  {hasSearch ? `No stores found for "${trimmedSearch}"` : "No stores have been added yet"}
                </p>
                <p className="mt-3 text-sm text-[var(--muted)]">
                  {hasSearch
                    ? "Try another store name, category, or slug to find matching results."
                    : "Add your first store from the admin dashboard to start building the catalog."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
