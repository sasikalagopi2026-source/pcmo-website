type PcmoLogoProps = {
  className?: string;
  compact?: boolean;
  light?: boolean;
  showTagline?: boolean;
};

const PcmoLogo = ({ className = "" }: PcmoLogoProps) => (
  <img
    src="/pcmo-logo.png"
    className={`object-contain ${className}`}
    alt="PCMO - Project & Contracts Management Organisation"
  />
);

export default PcmoLogo;
