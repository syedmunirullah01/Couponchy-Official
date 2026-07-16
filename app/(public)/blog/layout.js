import { getMetadataDefaults } from "@/server/services/settings-service";

export async function generateMetadata() {
  const baseMetadata = await getMetadataDefaults("Blogs");
  
  const title = "Couponchy - Blogs";
  const description = "Explore the latest shopping guides, product reviews, deals, discounts, and money-saving tips on the Couponchy Blog. Discover smart ways to shop and save more.";

  return {
    ...baseMetadata,
    title: title,
    description: description,
    openGraph: {
      ...baseMetadata.openGraph,
      title: title,
      description: description,
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
    }
  };
}

export default function BlogLayout({ children }) {
  return <>{children}</>;
}
