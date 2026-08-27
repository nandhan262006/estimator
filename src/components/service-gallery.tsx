"use client";

import Image from "next/image";

interface ServiceGalleryProps {
  images: { src: string; alt: string }[];
}

export function ServiceGallery({ images }: ServiceGalleryProps) {
  if (images.length === 0) return null;

  const duplicatedImages = [...images, ...images, ...images];

  return (
    <div className="group/gallery relative overflow-hidden rounded-2xl">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      <div
        className="flex gap-4 animate-scroll group-hover/gallery:[animation-play-state:paused]"
        style={{ width: "max-content" }}
      >
        {duplicatedImages.map((image, index) => (
          <div
            key={index}
            className="relative flex-none w-64 h-44 sm:w-80 sm:h-52 lg:w-96 lg:h-56 rounded-xl overflow-hidden group/item"
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover/item:scale-110"
              sizes="(max-width: 640px) 256px, (max-width: 1024px) 320px, 384px"
              priority={index < 4}
              loading={index < 4 ? undefined : "lazy"}
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-500" />
          </div>
        ))}
      </div>
    </div>
  );
}
