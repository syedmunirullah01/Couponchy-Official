import StoreCard from "./StoreCard";

export default function StoreGrid({ stores }) {
  return (
    <div className="flex-1">
      <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
        {stores.map((store) => (
          <StoreCard key={store.name} store={store} />
        ))}
      </div>
    </div>
  );
}

