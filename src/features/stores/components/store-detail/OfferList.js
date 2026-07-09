import OfferCard from "./OfferCard";

export default function OfferList({ offers, store, t }) {
  return (
    <div className="space-y-4">
      {offers.map((offer, index) => (
        <OfferCard key={offer.id ?? offer.title} offer={offer} store={store} isFirst={index === 0} t={t} />
      ))}
    </div>
  );
}

