"use client";

import { useState } from "react";

function FAQItem({ faq, index }) {
  const [open, setOpen] = useState(index === 0);

  return (
    <div className={`overflow-hidden rounded-[18px] border transition-all duration-300 ${open ? "border-[var(--color-primary)]/20 bg-[var(--color-primary)]/[0.03]" : "border-white/[0.05] bg-[#0c0c11]"}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center justify-between px-6 py-4 text-left"
      >
        <span className={`text-sm font-bold leading-snug transition-colors ${open ? "text-white" : "text-white/65"}`}>
          {faq.question}
        </span>
        <span className={`ml-4 flex-shrink-0 text-lg font-light transition-all duration-300 ${open ? "rotate-45 text-[var(--color-primary)]" : "text-white/25"}`}>
          +
        </span>
      </button>
      {open && (
        <div className="border-t border-white/[0.05] px-6 pb-5 pt-4 text-sm leading-6 text-white/45">
          {faq.answer}
        </div>
      )}
    </div>
  );
}

export default function StoreContent({ singleStore, faqs, t }) {
  return (
    <>
      {/* About Section */}
      <section id="store-info" className="mt-10 scroll-mt-28 overflow-hidden rounded-[24px] border border-white/[0.06] bg-[#0c0c11] p-7">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">{t.storeGuide}</span>
        </div>
        <h2 className="text-2xl font-black tracking-[-0.03em] text-white sm:text-3xl">
          {singleStore.introTitle}
        </h2>
        <div className="mt-5 space-y-4 text-sm leading-7 text-white/50">
          {singleStore.introParagraphs.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}

          {singleStore.whyItems?.length > 0 && (
            <div className="mt-6 rounded-[18px] border border-white/[0.05] bg-white/[0.02] p-5">
              <h3 className="mb-4 text-base font-black text-white/80">
                {t.whyUseBrand.replace("{name}", singleStore.name)}
              </h3>
              <ul className="space-y-2.5">
                {singleStore.whyItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-white/50">
                    <span className="mt-0.5 flex-shrink-0 text-[var(--color-primary)]">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {singleStore.outro && <p className="pt-2">{singleStore.outro}</p>}
        </div>
      </section>

      {/* FAQ Section */}
      {faqs?.length > 0 && (
        <section id="faqs" className="mt-8 scroll-mt-28">
          <div className="mb-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/[0.05]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25">FAQ</span>
            <div className="h-px flex-1 bg-white/[0.05]" />
          </div>
          <h2 className="mb-5 text-xl font-black tracking-[-0.02em] text-white sm:text-2xl">
            {t.faqTitle}
          </h2>
          <div className="space-y-2.5">
            {faqs.map((faq, index) => (
              <FAQItem key={faq.question} faq={faq} index={index} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
