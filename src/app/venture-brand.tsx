import Link from "next/link";
import Image from "next/image";

type VentureBrandProps = {
  className?: string;
  subtitle?: string;
};

export default function VentureBrand({ className = "", subtitle }: VentureBrandProps) {
  return (
    <Link href="/" className={`brand ${className}`.trim()} aria-label="VentureLab home">
      <span className="brand-symbol" aria-hidden="true">
        <Image src="/venturelab-logo.png" alt="" width={1536} height={1024} priority />
      </span>
      <span className="brand-label">
        <strong>VentureLab</strong>
        {subtitle && <small>{subtitle}</small>}
      </span>
    </Link>
  );
}
