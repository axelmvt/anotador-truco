export interface FaqItem {
  q: string;
  a: string;
}

// El schema FAQPage se arma con los mismos textos que se muestran en la página:
// Google exige que el marcado coincida con el contenido visible.
export const faqJsonLd = (faqs: FaqItem[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
});
