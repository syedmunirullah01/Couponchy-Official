import { getPublicSiteSettings } from "@/server/services/settings-service";
import { resolveRequestCountryCode } from "@/server/resolve-request-country";
import { COUNTRY_TO_LANG } from "@/server/services/translation-service";
import { getSeoAlternates } from "@/server/services/seo-alternates";

export const dynamic = "force-dynamic";

const localization = {
  en: {
    title: "Affiliate Disclosure",
    subtitle: "How we earn commissions and maintain our automated deal validation system.",
    disclosureTitle: "Compensation Disclosure",
    disclosureText: "Couponchy is an independent, ad-supported coupon and deal platform. To support our automated Playwright checkout checks, real-time database updates, and free access for all shoppers, we partner with affiliate networks and merchant programs.",
    howItWorksTitle: "How it Works",
    howItWorksText1: "When you click on a promo link or copy a coupon code and navigate to a store to make a purchase, we may receive a small commission from the merchant or affiliate network.",
    howItWorksText2: "This commission comes at absolutely no additional cost to you. The prices, discounts, and checking checkout operations remain exactly the same.",
    editorialTitle: "Editorial Integrity & Trust",
    editorialText: "Our automated testing algorithms verify and rank codes purely based on their validity and savings value. We never artificially rank or list invalid promo codes simply because a merchant offers higher affiliate commissions. If a coupon doesn't work, it is automatically removed from our platform, regardless of the affiliate relationship."
  },
  de: {
    title: "Affiliate-Offenlegung",
    subtitle: "Wie wir Provisionen verdienen und unser automatisiertes Gutschein-Validierungssystem betreiben.",
    disclosureTitle: "Offenlegung der Vergütung",
    disclosureText: "Couponchy ist eine unabhängige, werbefinanzierte Gutschein- und Dealplattform. Um unsere automatisierten Playwright-Checkout-Prüfungen, Echtzeit-Datenbankaktualisierungen und den kostenlosen Zugang für alle Käufer zu unterstützen, arbeiten wir mit Affiliate-Netzwerken und Händlerprogrammen zusammen.",
    howItWorksTitle: "Wie es funktioniert",
    howItWorksText1: "Wenn Sie auf einen Promotion-Link klicken oder einen Gutscheincode kopieren und zu einem Shop navigieren, um einen Kauf zu tätigen, erhalten wir möglicherweise eine kleine Provision vom Händler oder Affiliate-Netzwerk.",
    howItWorksText2: "Diese Provision entsteht für Sie mit absolut keinen zusätzlichen Kosten. Die Preise, Rabatte und Kassiervorgänge bleiben exakt dieselben.",
    editorialTitle: "Redaktionelle Integrität & Vertrauen",
    editorialText: "Unsere automatisierten Testalgorithmen verifizieren und bewerten Codes ausschließlich auf der Grundlage ihrer Gültigkeit und ihres Sparwerts. Wir bewerten oder listen niemals künstlich ungültige Promo-Codes, nur weil ein Händler höhere Affiliate-Provisionen anbietet. Wenn ein Gutschein nicht funktioniert, wird er automatisch von unserer Plattform entfernt, unabhängig von der Affiliate-Beziehung."
  },
  fr: {
    title: "Divulgation d'Affiliation",
    subtitle: "Comment nous gagnons des commissions et maintenons notre système automatisé de validation des offres.",
    disclosureTitle: "Divulgation des rémunérations",
    disclosureText: "Couponchy est une plateforme de coupons et de bons plans indépendante, financée par la publicité. Afin de financer nos vérifications automatisées via Playwright, nos mises à jour de base de données en temps réel et notre accès gratuit pour tous, nous collaborons avec des réseaux d'affiliation et des programmes de marchands.",
    howItWorksTitle: "Comment ça fonctionne",
    howItWorksText1: "Lorsque vous cliquez sur un lien promotionnel ou copiez un code promo et que vous vous rendez sur un magasin pour effectuer un achat, nous pouvons recevoir une petite commission du marchand ou du réseau d'affiliation.",
    howItWorksText2: "Cette commission ne représente aucun coût supplémentaire pour vous. Les prix, les réductions et le fonctionnement de la validation finale du panier restent strictement les mêmes.",
    editorialTitle: "Intégrité éditoriale et confiance",
    editorialText: "Nos algorithmes de test automatisés vérifient et classent les codes uniquement en fonction de leur validité et de leur valeur d'économie. Nous ne classons ni ne listons jamais artificiellement des codes promotionnels invalides simplement parce qu'un marchand propose des commissions d'affiliation plus élevées. Si un coupon ne fonctionne pas, il est automatiquement retiré de notre plateforme, quelle que soit la relation d'affiliation."
  },
  es: {
    title: "Divulgación de Afiliados",
    subtitle: "Cómo ganamos comisiones y mantenemos nuestro sistema automatizado de validación de ofertas.",
    disclosureTitle: "Divulgación de compensaciones",
    disclosureText: "Couponchy es una plataforma independiente de cupones y ofertas patrocinada por publicidad. Para financiar nuestras comprobaciones automatizadas de Playwright, actualizaciones de la base de datos en tiempo real y el acceso gratuito para todos los compradores, colaboramos con redes de afiliados y programas de comerciantes.",
    howItWorksTitle: "Cómo funciona",
    howItWorksText1: "Cuando hace clic en un enlace promocional o copia un código de cupón y navega a una tienda para realizar una compra, podemos recibir una pequeña comisión del comerciante o de la red de afiliados.",
    howItWorksText2: "Esta comisión no tiene ningún coste adicional para usted. Los precios, descuentos y procesos de pago siguen siendo exactamente los mismos.",
    editorialTitle: "Integridad editorial y confianza",
    editorialText: "Nuestros algoritmos de prueba automatizados verifican y clasifican los códigos basándose únicamente en su validez y valor de ahorro. Nunca clasificamos ni enumeramos artificialmente códigos promocionales no válidos solo porque un comerciante ofrezca comisiones de afiliación más altas. Si un cupón no funciona, se elimina automáticamente de nuestra plataforma, independientemente de la relación de afiliados."
  },
  nl: {
    title: "Affiliate-openbaarmaking",
    subtitle: "Hoe wij commissies verdienen en ons geautomatiseerde dealvalidatiesysteem onderhouden.",
    disclosureTitle: "Bekendmaking van vergoedingen",
    disclosureText: "Couponchy is een onafhankelijk, door advertenties ondersteund coupon- en dealplatform. Om onze geautomatiseerde Playwright-kassacontroles, realtime database-updates en gratis toegang voor alle winkelpatronen te ondersteunen, werken we samen met affiliate netwerken en merchantprogramma's.",
    howItWorksTitle: "Hoe het werkt",
    howItWorksText1: "Wanneer u op een promotielink klikt of een couponcode kopieert en naar een winkel navigeert om een aankoop te doen, kunnen wij een kleine commissie ontvangen van de winkelier of het affiliatenetwerk.",
    howItWorksText2: "Deze commissie brengt absoluut geen extra kosten voor u met zich mee. De prijzen, kortingen en transactievoorwaarden blijven exact hetzelfde.",
    editorialTitle: "Redactionele integriteit & vertrouwen",
    editorialText: "Onze geautomatiseerde testalgoritmen verifiëren en rangschikken codes uitsluitend op basis van hun geldigheid en besparingswaarde. We zullen nooit kunstmatig ongeldige promotiecodes rangschikken of vermelden, simpelweg omdat een verkoper hogere affiliatecommissies biedt. Als een coupon niet werkt, wordt deze automatisch van ons platform verwijderd, ongeacht de affiliaterelatie."
  },
  pl: {
    title: "Ujawnienie Afiliacji",
    subtitle: "Jak zarabiamy prowizje i utrzymujemy nasz automatyczny system walidacji ofert.",
    disclosureTitle: "Ujawnienie informacji o wynagrodzeniu",
    disclosureText: "Couponchy to niezależna, wspierana reklamami platforma z kuponami i ofertami. Aby wesprzeć nasze automatyczne kontrole transakcji Playwright, aktualizacje bazy danych w czasie rzeczywistym i darmowy dostęp dla wszystkich kupujących, współpracujemy z sieciami afiliacyjnymi i programami sprzedawców.",
    howItWorksTitle: "Jak to działa",
    howItWorksText1: "Kiedy klikniesz link promocyjny lub skopiujesz kod kuponu i przejdziesz do sklepu w celu dokonania zakupu, możemy otrzymać niewielką prowizję od sprzedawcy lub sieci afiliacyjnej.",
    howItWorksText2: "Prowizja ta nie wiąże się z żadnymi dodatkowymi kosztami dla Ciebie. Ceny, rabaty i procedury realizacji zamówienia pozostają dokładnie takie same.",
    editorialTitle: "Rzetelność redakcyjna i zaufanie",
    editorialText: "Nasze automatyczne algorytmy testowe weryfikują i pozycjonują kody wyłącznie na podstawie ich ważności i wartości oszczędności. Nigdy nie pozycjonujemy ani nie wyświetlamy sztucznie nieważnych kodów promocyjnych tylko dlatego, że sprzedawca oferuje wyższe prowizje afiliacyjne. Jeśli kupon nie działa, jest automatycznie usuwany z naszej platformy, niezależnie od relacji afiliacyjnej."
  },
  it: {
    title: "Informativa sull'Affiliazione",
    subtitle: "Come guadagniamo commissioni e manteniamo il nostro sistema automatizzato di convalida delle offerte.",
    disclosureTitle: "Informativa sui compensi",
    disclosureText: "Couponchy è una piattaforma di coupon e offerte indipendente, supportata da pubblicità. Per sostenere i nostri controlli automatici di cassa con Playwright, gli aggiornamenti del database in tempo reale e l'accesso gratuito per tutti gli utenti, collaboriamo con reti di affiliazione e programmi commerciali.",
    howItWorksTitle: "Come funziona",
    howItWorksText1: "Quando fai clic su un link promozionale o copi un codice coupon e navighi su un negozio per effettuare un acquisto, potremmo ricevere una piccola commissione dal commerciante o dalla rete di affiliazione.",
    howItWorksText2: "Questa commissione non comporta assolutamente alcun costo aggiuntivo per te. I prezzi, gli sconti e le operazioni di pagamento rimangono esattamente gli stessi.",
    editorialTitle: "Integrità editoriale e fiducia",
    editorialText: "I nostri algoritmi di test automatici verificano e classificano i codici basandosi esclusivamente sulla loro validità e sul valore di risparmio. Non classifichiamo né elenchiamo mai artificialmente codici promozionali non validi semplicemente perché un commerciante offre commissioni di affiliazione più elevate. Se un coupon non funziona, viene rimosso automaticamente dal nostro portale, indipendentemente dal rapporto di affiliazione."
  },
  ar: {
    title: "إفصاح الأفلييت",
    subtitle: "كيف نكسب العمولات ونحافظ على نظامنا الآلي للتحقق من العروض.",
    disclosureTitle: "الإفصاح عن التعويضات",
    disclosureText: "كوبونتشي هي منصة مستقلة مدعومة بالإعلانات للكوبونات والعروض. ولدعم عمليات التحقق الآلي من الدفع التي نقوم بها عبر Playwright، وتحديثات قاعدة البيانات الفورية، والوصول المجاني لجميع المتسوقين، فإننا نتشارك مع شبكات الأفلييت وبرامج التجار.",
    howItWorksTitle: "كيف يعمل هذا",
    howItWorksText1: "عندما تنقر على رابط ترويجي أو تنسخ رمز كوبون وتنتقل إلى متجر لإجراء عملية شراء، فقد نتلقى عمولة صغيرة من التاجر أو شبكة الأفلييت.",
    howItWorksText2: "هذه العمولة تأتي دون أي تكلفة إضافية عليك على الإطلاق. تظل الأسعار والخصومات وعمليات الدفع كما هي تمامًا.",
    editorialTitle: "النزاهة التحريرية والثقة",
    editorialText: "تتحقق خوارزميات الاختبار الآلي الخاصة بنا من الرموز وتصنفها بناءً على صلاحيتها وقيمتها التوفيرية فقط. نحن لا نصنف أو ندرج أبداً رموزاً ترويجية غير صالحة لمجرد أن التاجر يقدم عمولات أفلييت أعلى. إذا كان الكوبون لا يعمل، فسيتم إزالته تلقائياً من منصتنا، بغض النظر عن علاقة الأفلييت."
  }
};

export async function generateMetadata() {
  const countryCode = await resolveRequestCountryCode();
  const lang = COUNTRY_TO_LANG[String(countryCode || "").toUpperCase()] || "en";
  const selected = localization[lang] || localization.en;

  const alternates = await getSeoAlternates("/affiliate-disclosure", countryCode);

  return {
    title: `${selected.title} | Couponchy`,
    description: selected.subtitle,
    alternates,
    openGraph: {
      title: `${selected.title} | Couponchy`,
      description: selected.subtitle,
      url: alternates.canonical,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${selected.title} | Couponchy`,
      description: selected.subtitle,
    },
  };
}

export default async function Page() {
  const countryCode = await resolveRequestCountryCode();
  const lang = COUNTRY_TO_LANG[String(countryCode || "").toUpperCase()] || "en";
  const selected = localization[lang] || localization.en;

  const settings = await getPublicSiteSettings();
  const siteName = settings?.siteName || "Couponchy";

  return (
    <div style={{ color: "#fff", fontFamily: "inherit", overflow: "hidden" }}>
      {/* Background radial ambient glow overlay */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-100px", left: "50%", transform: "translateX(-50%)", width: "900px", height: "500px", background: "radial-gradient(ellipse, rgba(139,92,246,0.06) 0%, transparent 70%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: "800px", margin: "0 auto", padding: "80px 24px 120px" }}>
        
        {/* Header Block */}
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "999px", padding: "6px 18px", marginBottom: "24px" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-primary)", boxShadow: "0 0 10px var(--color-primary)", display: "inline-block" }} />
            <span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-primary)" }}>Earnings Disclosure</span>
          </div>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.04em", margin: "0 0 20px" }}>
            {selected.title}
          </h1>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.45)", maxWidth: "560px", margin: "0 auto", lineHeight: 1.6, fontWeight: 500 }}>
            {selected.subtitle}
          </p>
        </div>

        {/* Content Block */}
        <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
          
          {/* Section 1: Disclosure Statement */}
          <section style={{ background: "rgba(15,15,20,0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "32px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 16px", color: "#fff", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ height: "2px", width: "12px", background: "var(--color-primary)" }} />
              {selected.disclosureTitle}
            </h2>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
              {selected.disclosureText.replace("Couponchy", siteName)}
            </p>
          </section>

          {/* Section 2: How It Works */}
          <section style={{ background: "rgba(15,15,20,0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "32px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0", color: "#fff", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ height: "2px", width: "12px", background: "var(--color-primary)" }} />
              {selected.howItWorksTitle}
            </h2>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
              {selected.howItWorksText1}
            </p>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
              {selected.howItWorksText2}
            </p>
          </section>

          {/* Section 3: Editorial Integrity */}
          <section style={{ background: "rgba(15,15,20,0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "32px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 16px", color: "#fff", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ height: "2px", width: "12px", background: "var(--color-primary)" }} />
              {selected.editorialTitle}
            </h2>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
              {selected.editorialText.replace("Couponchy", siteName)}
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}
