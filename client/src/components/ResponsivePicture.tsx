import { useEffect, useState } from "react";

interface ResponsivePictureProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: "lazy" | "eager";
  decoding?: "async" | "sync" | "auto";
  fetchPriority?: "high" | "low" | "auto";
  sizes?: string;
  srcSet?: string;
  avifSrc?: string;
  webpSrc?: string;
}

export function ResponsivePicture({
  src,
  alt,
  width,
  height,
  className = "",
  loading = "lazy",
  decoding = "async",
  fetchPriority,
  sizes = "100vw",
  srcSet,
  avifSrc,
  webpSrc,
}: ResponsivePictureProps) {
  const [supportsAvif, setSupportsAvif] = useState<boolean | null>(null);
  const [supportsWebp, setSupportsWebp] = useState<boolean | null>(null);

  useEffect(() => {
    // Check AVIF support
    const checkAvif = () => {
      const canvas = document.createElement("canvas");
      if (canvas.getContext && canvas.getContext("2d")) {
        return canvas.toDataURL("image/avif").indexOf("data:image/avif") === 0;
      }
      return false;
    };

    // Check WebP support
    const checkWebp = () => {
      const elem = document.createElement("canvas");
      if (elem.getContext && elem.getContext("2d")) {
        return elem.toDataURL("image/webp").indexOf("data:image/webp") === 0;
      }
      return false;
    };

    setSupportsAvif(checkAvif());
    setSupportsWebp(checkWebp());
  }, []);

  // Generate srcSet for responsive images if not provided
  const generateSrcSet = (baseSrc: string) => {
    if (srcSet) return srcSet;
    // You can customize this based on your image naming convention
    const ext = baseSrc.split(".").pop();
    const baseName = baseSrc.replace(`.${ext}`, "");
    return `${baseName}-400.${ext} 400w, ${baseName}-800.${ext} 800w, ${baseName}-1200.${ext} 1200w`;
  };

  return (
    <picture>
      {/* AVIF source */}
      {(avifSrc || src.endsWith(".jpg") || src.endsWith(".jpeg") || src.endsWith(".png")) && (
        <source
          srcSet={avifSrc || src.replace(/\.(jpg|jpeg|png)$/i, ".avif")}
          type="image/avif"
          sizes={sizes}
        />
      )}

      {/* WebP source */}
      {(webpSrc || src.endsWith(".jpg") || src.endsWith(".jpeg") || src.endsWith(".png")) && (
        <source
          srcSet={webpSrc || src.replace(/\.(jpg|jpeg|png)$/i, ".webp")}
          type="image/webp"
          sizes={sizes}
        />
      )}

      {/* Fallback image */}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading={loading}
        decoding={decoding}
        fetchPriority={fetchPriority}
        sizes={sizes}
        srcSet={generateSrcSet(src)}
      />
    </picture>
  );
}
