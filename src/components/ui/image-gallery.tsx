import { cn } from "@/lib/utils";

export type ImageGalleryItem = {
  src: string;
  title?: string;
};

export type ImageGalleryProps = {
  items: ImageGalleryItem[];
  className?: string;
};

export function ImageGallery({ items, className }: ImageGalleryProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className={cn("w-full flex flex-col items-center justify-start", className)}>
      <div className="flex items-center gap-2 h-[400px] md:h-[500px] w-full max-w-6xl mt-10 px-4">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="relative group flex-grow transition-all w-16 md:w-32 rounded-2xl overflow-hidden h-full duration-700 ease-in-out hover:w-[400px] hover:flex-grow-[4] cursor-pointer shadow-xl border border-white/10 hover:border-red-500/50"
          >
            <img
              className="h-full w-full object-cover object-center brightness-75 group-hover:brightness-100 transition-all duration-700"
              src={item.src}
              alt={item.title || `image-${idx}`}
            />
            {item.title && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100">
                <p className="text-white font-bold uppercase tracking-widest text-sm md:text-lg drop-shadow-md">
                  {item.title}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
