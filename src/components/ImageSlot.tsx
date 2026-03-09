/* eslint-disable @next/next/no-img-element */

type ImageSlotProps = {
  src: string;
  alt: string;
  className?: string;
};

export function ImageSlot({ src, alt, className }: ImageSlotProps) {
  return (
    <div className={`relative overflow-hidden bg-stone-200 ${className ?? ""}`}>
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover object-center"
      />
    </div>
  );
}
