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
    <rect x="3" y="7" width="26" height="18" rx="4.5" strokeWidth={2.2} />
    <path d="M7 12l2.2 8 2.2-8" />
    <path d="M13.8 20l2.2-8 2.2 8M14.6 17.2h2.8" />
    <path d="M20.6 20v-8h2.4a2.1 2.1 0 0 1 0 4.2h-2.4M22.3 16.2 25 20" />
  </svg>
);

export default VarIcon;
