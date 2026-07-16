import { getCompanyContent } from "@/server/repositories/company-repository";
import { getPublicSiteSettings } from "@/server/services/settings-service";
import { resolveRequestCountryCode } from "@/server/resolve-request-country";
import { COUNTRY_TO_LANG } from "@/server/services/translation-service";
import { getSeoAlternates } from "@/server/services/seo-alternates";

export const dynamic = "force-dynamic";

const localization = {
  en: {
    title: "Imprint",
    subtitle: "Legal information and website disclosures.",
    operator: "Website Operator",
    operatorVal: "Couponchy Ltd.",
    representedBy: "Represented by",
    representedVal: "Couponchy Operations Team",
    contactInfo: "Contact Information",
    phone: "Phone",
    email: "Email",
    address: "Address",
    disclaimerTitle: "Disclaimer",
    contentTitle: "Liability for Content",
    contentDesc: "The contents of our pages were created with the greatest care. However, we cannot assume any liability for the correctness, completeness, and topicality of the contents.",
    linksTitle: "Liability for Links",
    linksDesc: "Our service contains links to external websites of third parties, on whose contents we have no influence. Therefore, we cannot assume any liability for these external contents. The respective provider or operator of the pages is always responsible for the contents of the linked pages.",
    copyrightTitle: "Copyright",
    copyrightDesc: "The content and works created by the website operators on these pages are subject to copyright law. The duplication, processing, distribution, and any kind of exploitation outside the limits of copyright require the written consent of the respective author or creator."
  },
  de: {
    title: "Impressum",
    subtitle: "Gesetzliche Angaben und rechtliche Hinweise.",
    operator: "Betreiber der Website",
    operatorVal: "Couponchy Ltd.",
    representedBy: "Vertreten durch",
    representedVal: "Couponchy Operations Team",
    contactInfo: "Kontaktinformationen",
    phone: "Telefon",
    email: "E-Mail",
    address: "Anschrift",
    disclaimerTitle: "Haftungsausschluss",
    contentTitle: "Haftung für Inhalte",
    contentDesc: "Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.",
    linksTitle: "Haftung für Links",
    linksDesc: "Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.",
    copyrightTitle: "Urheberrecht",
    copyrightDesc: "Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers."
  },
  fr: {
    title: "Mentions Légales",
    subtitle: "Informations légales et mentions obligatoires.",
    operator: "Éditeur du site",
    operatorVal: "Couponchy Ltd.",
    representedBy: "Représenté par",
    representedVal: "Équipe opérationnelle Couponchy",
    contactInfo: "Coordonnées de contact",
    phone: "Téléphone",
    email: "E-mail",
    address: "Adresse",
    disclaimerTitle: "Clause de non-responsabilité",
    contentTitle: "Responsabilité du contenu",
    contentDesc: "Le contenu de nos pages a été créé avec le plus grand soin. Toutefois, nous ne pouvons assumer aucune responsabilité quant à l'exactitude, l'exhaustivité et l'actualité du contenu.",
    linksTitle: "Responsabilité des liens",
    linksDesc: "Notre offre contient des liens vers des sites web externes de tiers, sur le contenu desquels nous n'avons aucune influence. Par conséquent, nous ne pouvons assumer aucune responsabilité pour ces contenus externes. Le fournisseur ou l'exploitant respectif des pages est toujours responsable du contenu des pages liées.",
    copyrightTitle: "Droit d'auteur",
    copyrightDesc: "Le contenu et les œuvres créés par les exploitants du site sur ces pages sont soumis à la législation sur le droit d'auteur. La reproduction, le traitement, la distribution et tout type d'exploitation en dehors des limites du droit d'auteur nécessitent le consentement écrit de l'auteur ou du créateur respectif."
  },
  es: {
    title: "Aviso Legal",
    subtitle: "Información legal y declaraciones del sitio web.",
    operator: "Operador del sitio web",
    operatorVal: "Couponchy Ltd.",
    representedBy: "Representado por",
    representedVal: "Equipo de Operaciones de Couponchy",
    contactInfo: "Información de contacto",
    phone: "Teléfono",
    email: "Correo electrónico",
    address: "Dirección",
    disclaimerTitle: "Descargo de responsabilidad",
    contentTitle: "Responsabilidad por el contenido",
    contentDesc: "Los contenidos de nuestras páginas han sido creados con el mayor cuidado. Sin embargo, no podemos asumir ninguna responsabilidad por la exactitud, integridad y actualidad de los contenidos.",
    linksTitle: "Responsabilidad por los enlaces",
    linksDesc: "Nuestra oferta contiene enlaces a sitios web externos de terceros, sobre cuyos contenidos no tenemos influencia. Por lo tanto, no podemos asumir ninguna responsabilidad por estos contenidos externos. El respectivo proveedor u operador de las páginas es siempre el responsable de los contenidos de las páginas enlazadas.",
    copyrightTitle: "Derechos de autor",
    copyrightDesc: "El contenido y las obras creadas por los operadores del sitio web en estas páginas están sujetos a la ley de derechos de autor. La duplicación, el procesamiento, la distribución y cualquier tipo de explotación fuera de los límites de la ley de derechos de autor requieren el consentimiento por escrito del respectivo autor o creador."
  },
  nl: {
    title: "Colofon",
    subtitle: "Wettelijke informatie en sitetoelichtingen.",
    operator: "Exploitant van de website",
    operatorVal: "Couponchy Ltd.",
    representedBy: "Vertegenwoordigd door",
    representedVal: "Couponchy Operations Team",
    contactInfo: "Contactinformatie",
    phone: "Telefoon",
    email: "E-mail",
    address: "Adres",
    disclaimerTitle: "Disclaimer",
    contentTitle: "Aansprakelijkheid voor inhoud",
    contentDesc: "De inhoud van onze pagina's is met de grootste zorgvuldigheid samengesteld. Voor de juistheid, volledigheid en actualiteit van de inhoud kunnen wij echter geen aansprakelijkheid aanvaarden.",
    linksTitle: "Aansprakelijkheid voor links",
    linksDesc: "Ons aanbod bevat links naar externe websites van derden, op de inhoud waarvan wij geen invloed hebben. Daarom kunnen wij voor deze externe inhoud geen aansprakelijkheid aanvaarden. Voor de inhoud van de gelinkte pagina's is steeds de respectievelijke aanbieder of exploitant van de pagina's verantwoordelijk.",
    copyrightTitle: "Auteursrecht",
    copyrightDesc: "De door de exploitanten van de website op deze pagina's gecreëerde inhoud en werken zijn onderworpen aan het auteursrecht. Kopiëren, bewerken, verspreiden en elke vorm van exploitatie buiten de grenzen van het auteursrecht vereisen de schriftelijke toestemming van de respectievelijke auteur of maker."
  },
  pl: {
    title: "Stopka Redakcyjna",
    subtitle: "Informacje prawne i deklaracje serwisu.",
    operator: "Operator serwisu",
    operatorVal: "Couponchy Ltd.",
    representedBy: "Reprezentowany przez",
    representedVal: "Zespół Operacyjny Couponchy",
    contactInfo: "Informacje kontaktowe",
    phone: "Telefon",
    email: "E-mail",
    address: "Adres",
    disclaimerTitle: "Wyłączenie odpowiedzialności",
    contentTitle: "Odpowiedzialność za treści",
    contentDesc: "Treści na naszych stronach zostały stworzone z największą starannością. Nie możemy jednak przejąć odpowiedzialności za poprawność, kompletność i aktualność treści.",
    linksTitle: "Odpowiedzialność za linki",
    linksDesc: "Nasza oferta zawiera linki do zewnętrznych stron internetowych osób trzecich, na których treść nie mamy wpływu. Dlatego nie możemy przejąć żadnej odpowiedzialności za te obce treści. Za treść linkowanych stron odpowiada zawsze odpowiedni dostawca lub operator tych stron.",
    copyrightTitle: "Prawo autorskie",
    copyrightDesc: "Treści i dzieła stworzone przez operatorów stron na tych stronach podlegają prawu autorskiemu. Powielanie, przetwarzanie, rozpowszechnianie oraz wszelkiego rodzaju eksploatacja poza granicami prawa autorskiego wymagają pisemnej zgody odpowiedniego autora lub twórcy."
  },
  it: {
    title: "Note Legali",
    subtitle: "Informazioni legali e dichiarazioni del sito.",
    operator: "Gestore del sito web",
    operatorVal: "Couponchy Ltd.",
    representedBy: "Rappresentato da",
    representedVal: "Team Operativo Couponchy",
    contactInfo: "Informazioni di contatto",
    phone: "Telefono",
    email: "E-mail",
    address: "Indirizzo",
    disclaimerTitle: "Esclusione di responsabilità",
    contentTitle: "Responsabilità per i contenuti",
    contentDesc: "I contenuti delle nostre pagine sono stati creati con la massima cura. Tuttavia, non possiamo assumerci alcuna responsabilità per la correttezza, la completezza e l'attualità dei contenuti.",
    linksTitle: "Responsabilità per i collegamenti",
    linksDesc: "La nostra offerta contiene collegamenti a siti web esterni di terze parti, sui cui contenuti non abbiamo alcuna influenza. Pertanto, non possiamo assumerci alcuna responsabilità per questi contenuti esterni. Il rispettivo fornitore o gestore delle pagine è sempre responsabile del contenuto delle pagine collegate.",
    copyrightTitle: "Diritto d'autore",
    copyrightDesc: "I contenuti e le opere creati dai gestori del sito su queste pagine sono soggetti alla legge sul diritto d'autore. La riproduzione, l'elaborazione, la distribuzione e qualsiasi tipo di sfruttamento al di fuori dei limiti della legge sul diritto d'autore richiedono il consenso scritto del rispettivo autore o creatore."
  },
  ar: {
    title: "البيانات القانونية",
    subtitle: "المعلومات القانونية والإفصاحات الخاصة بالموقع.",
    operator: "مشغل الموقع",
    operatorVal: "كوبونتشي المحدودة",
    representedBy: "يمثلها",
    representedVal: "فريق عمليات كوبونتشي",
    contactInfo: "معلومات الاتصال",
    phone: "الهاتف",
    email: "البريد الإلكتروني",
    address: "العنوان",
    disclaimerTitle: "إخلاء المسؤولية",
    contentTitle: "المسؤولية عن المحتوى",
    contentDesc: "تم إنشاء محتويات صفحاتنا بأقصى قدر من العناية. ومع ذلك، لا يمكننا تحمل أي مسؤولية عن صحة المحتويات واكتمالها وحداثتها.",
    linksTitle: "المسؤولية عن الروابط",
    linksDesc: "يحتوي موقعنا على روابط لمواقع خارجية لأطراف ثالثة، ليس لنا أي تأثير على محتوياتها. لذلك، لا يمكننا تحمل أي مسؤولية عن هذه المحتويات الخارجية. ويتحمل مقدم الخدمة أو المشغل المعني بالصفحات دائمًا مسؤولية محتوى الصفحات المرتبطة.",
    copyrightTitle: "حقوق النشر",
    copyrightDesc: "تخضع المحتويات والأعمال التي ينشئها مشغلو الموقع على هذه الصفحات لقانون حقوق النشر. وتتطلب عمليات النسخ والمعالجة والتوزيع وأي نوع من الاستغلال خارج حدود قانون حقوق النشر الحصول على موافقة خطية من المؤلف أو المنشئ المعني."
  }
};

export async function generateMetadata() {
  const countryCode = await resolveRequestCountryCode();
  const lang = COUNTRY_TO_LANG[String(countryCode || "").toUpperCase()] || "en";
  const selected = localization[lang] || localization.en;

  const alternates = await getSeoAlternates("/imprint", countryCode);

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

  const [company, settings] = await Promise.all([
    getCompanyContent(),
    getPublicSiteSettings(),
  ]);

  const siteName = settings?.siteName || "Couponchy";
  const email = company?.contactUs?.email || settings?.supportEmail || "support@couponchy.com";
  const phone = company?.contactUs?.phone || "";
  const address = company?.contactUs?.address || "";

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
            <span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-primary)" }}>Legal Disclosure</span>
          </div>
          <h1 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.04em", margin: "0 0 20px" }}>
            {selected.title}
          </h1>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.45)", maxWidth: "560px", margin: "0 auto", lineHeight: 1.6, fontWeight: 500 }}>
            {selected.subtitle}
          </p>
        </div>

        {/* Content Block */}
        <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
          
          {/* Section 1: Imprint specifications */}
          <section style={{ background: "rgba(15,15,20,0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "32px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 24px", color: "#fff", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ height: "2px", width: "12px", background: "var(--color-primary)" }} />
              {selected.operator}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "18px", fontSize: "14px", color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
              <div>
                <span style={{ color: "rgba(255,255,255,0.4)", display: "block", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                  {selected.operator}
                </span>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: "16px" }}>{siteName}</span>
              </div>
              
              {address && (
                <div>
                  <span style={{ color: "rgba(255,255,255,0.4)", display: "block", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                    {selected.address}
                  </span>
                  <span>{address}</span>
                </div>
              )}

              <div>
                <span style={{ color: "rgba(255,255,255,0.4)", display: "block", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                  {selected.representedBy}
                </span>
                <span>{selected.representedVal}</span>
              </div>
            </div>
          </section>

          {/* Section 2: Contact Info */}
          <section style={{ background: "rgba(15,15,20,0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "32px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 24px", color: "#fff", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ height: "2px", width: "12px", background: "var(--color-primary)" }} />
              {selected.contactInfo}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "18px", fontSize: "14px", color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
              <div>
                <span style={{ color: "rgba(255,255,255,0.4)", display: "block", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                  {selected.email}
                </span>
                <a href={`mailto:${email}`} style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 700 }}>
                  {email}
                </a>
              </div>

              {phone && (
                <div>
                  <span style={{ color: "rgba(255,255,255,0.4)", display: "block", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                    {selected.phone}
                  </span>
                  <span>{phone}</span>
                </div>
              )}
            </div>
          </section>

          {/* Section 3: Legal Disclaimers */}
          <section style={{ background: "rgba(15,15,20,0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0", color: "#fff", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ height: "2px", width: "12px", background: "var(--color-primary)" }} />
              {selected.disclaimerTitle}
            </h2>
            
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: 800, color: "#fff", margin: "0 0 8px" }}>
                {selected.contentTitle}
              </h3>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                {selected.contentDesc}
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: "14px", fontWeight: 800, color: "#fff", margin: "0 0 8px" }}>
                {selected.linksTitle}
              </h3>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                {selected.linksDesc}
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: "14px", fontWeight: 800, color: "#fff", margin: "0 0 8px" }}>
                {selected.copyrightTitle}
              </h3>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                {selected.copyrightDesc}
              </p>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}
