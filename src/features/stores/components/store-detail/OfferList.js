import OfferCard from "./OfferCard";

export default function OfferList({ offers, store }) {
  return (
    <div className="space-y-4">
      {offers.map((offer) => (
        <OfferCard key={offer.id ?? offer.title} offer={offer} store={store} />
      ))}
    </div>
  );
}

