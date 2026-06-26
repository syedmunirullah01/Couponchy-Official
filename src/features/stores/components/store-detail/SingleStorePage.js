import OfferSection from "./OfferSection";
import ProductsSection from "./ProductsSection";
import StoreContent from "./StoreContent";
import StoreHeader from "./StoreHeader";
import StoreSidebar from "./StoreSidebar";

export default function SingleStorePage({ singleStore, storeTabs, offerTabs, offers, products, faqs, relatedStores }) {
  return (
    <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6 lg:px-8">
      <StoreHeader singleStore={singleStore} storeTabs={storeTabs} offerTabs={offerTabs} />
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <StoreSidebar singleStore={singleStore} relatedStores={relatedStores} />
        <div className="min-w-0 flex-1">
          <OfferSection offerTabs={offerTabs} offers={offers} store={singleStore} />
          <ProductsSection products={products} />
          <StoreContent singleStore={singleStore} faqs={faqs} />
        </div>
      </div>
    </div>
  );
}
