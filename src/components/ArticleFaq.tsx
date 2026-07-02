import type { FaqItem } from "@/lib/seo";

const ArticleFaq = ({ faqs }: { faqs: FaqItem[] }) => (
  <section className="mt-10">
    <h2 className="text-xl font-semibold mb-4">Preguntas frecuentes</h2>
    <div className="space-y-5">
      {faqs.map(({ q, a }) => (
        <div key={q}>
          <h3 className="text-lg font-semibold mb-1">{q}</h3>
          <p>{a}</p>
        </div>
      ))}
    </div>
  </section>
);

export default ArticleFaq;
