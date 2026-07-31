// Recuadro con "VAR" dibujado como trazos. No usa tipografía (no depende de la
// fuente cargada) ni reproduce el logo oficial del VAR, que es marca registrada.
const VarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <rect x="1.5" y="5" width="29" height="22" rx="5" strokeWidth={2.2} />
    <path d="M5 10.5 7.6 21.5 10.2 10.5" />
    <path d="M12.2 21.5 15 10.5 17.8 21.5M13.3 17.6h3.4" />
    <path d="M20 21.5v-11h3.2a2.9 2.9 0 0 1 0 5.8H20M22.9 16.3 26.4 21.5" />
  </svg>
);

export default VarIcon;
