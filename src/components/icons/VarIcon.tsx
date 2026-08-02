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
    <rect x="1.5" y="6.5" width="29" height="19" rx="4.5" strokeWidth={2.2} />
    <path d="M5.5 11.5 8.3 20.5 11.1 11.5" />
    <path d="M13.1 20.5 15.9 11.5 18.7 20.5M14.2 17.4h3.4" />
    <path d="M20.9 20.5v-9h3a2.5 2.5 0 0 1 0 5h-3M23.3 16.5 26.5 20.5" />
  </svg>
);

export default VarIcon;
