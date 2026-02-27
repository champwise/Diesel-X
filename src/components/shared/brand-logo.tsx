import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoVariant =
  | "primary"
  | "white"
  | "red"
  | "icon-primary"
  | "icon-red"
  | "icon-white";

const variantMap: Record<BrandLogoVariant, { src: string; defaultAlt: string }> = {
  primary: { src: "/brand/SVG/Logo%20Primary.svg", defaultAlt: "Diesel-X logo" },
  white: { src: "/brand/SVG/Logo%20White.svg", defaultAlt: "Diesel-X logo" },
  red: { src: "/brand/SVG/Logo%20Red.svg", defaultAlt: "Diesel-X logo" },
  "icon-primary": { src: "/brand/SVG/Icon%20Primary.svg", defaultAlt: "Diesel-X icon" },
  "icon-red": { src: "/brand/SVG/Icon%20Red.svg", defaultAlt: "Diesel-X icon" },
  "icon-white": { src: "/brand/SVG/Icon%20White.svg", defaultAlt: "Diesel-X icon" },
};

type BrandLogoProps = Omit<ImageProps, "src" | "alt"> & {
  variant?: BrandLogoVariant;
  alt?: string;
};

export function BrandLogo({
  variant = "primary",
  alt,
  width = 172,
  height = 66,
  className,
  ...props
}: BrandLogoProps) {
  const asset = variantMap[variant];

  return (
    <Image
      src={asset.src}
      alt={alt ?? asset.defaultAlt}
      width={width}
      height={height}
      className={cn("h-auto w-auto", className)}
      {...props}
    />
  );
}
