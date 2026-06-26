export default function StoreContent({ singleStore, faqs }) {
  return (
    <>
      <section id="store-info" className="mt-12 scroll-mt-28 rounded-[24px] border border-[var(--border)] bg-[linear-gradient(180deg,#11190b_0%,#12200c_100%)] p-8">
        <h2 className="text-4xl font-bold tracking-tight text-white">{singleStore.introTitle}</h2>
        <div className="mt-6 space-y-4 text-sm leading-7 text-white/60">
          {singleStore.introParagraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <h3 className="pt-2 text-lg font-bold text-white">Why Use {singleStore.name} Coupons from Couponchy</h3>
          <ul className="list-disc space-y-2 pl-5">
            {singleStore.whyItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>{singleStore.outro}</p>
        </div>
      </section>

      <section id="faqs" className="mt-12 scroll-mt-28">
        <h2 className="text-[34px] font-bold tracking-tight text-white">
          Frequently Asked Questions About {singleStore.name} Coupons & Deals
        </h2>
        <div className="mt-6 space-y-4">
          {faqs.map((faq, index) => (
            <details
              key={faq.question}
              className="group rounded-[20px] border border-[var(--border)] bg-[linear-gradient(90deg,#11190b_0%,#15240c_100%)]"
              open={index === 0}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between p-6 text-base font-bold text-white">
                <span>{faq.question}</span>
                <span className="text-[var(--accent)] transition group-open:rotate-180">⌄</span>
              </summary>
              <div className="px-6 pb-6 text-sm leading-6 text-white/56">{faq.answer}</div>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}

