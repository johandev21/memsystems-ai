"use client";

import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  type ComponentProps,
  createContext,
  type HTMLAttributes,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugins = UseCarouselParameters[1];

interface CarouselContextProps {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  api: CarouselApi;
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  selectedIndex: number;
  scrollSnaps: number[];
  onSelect: (index: number) => void;
}

const CarouselContext = createContext<CarouselContextProps | null>(null);

function useCarousel() {
  const context = useContext(CarouselContext);
  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }
  return context;
}

function Carousel({
  opts,
  plugins,
  setApi,
  onCarouselChange,
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  opts?: CarouselOptions;
  plugins?: CarouselPlugins;
  setApi?: (api: CarouselApi) => void;
  onCarouselChange?: (index: number) => void;
}) {
  const [carouselRef, api] = useEmblaCarousel(opts, plugins);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onSelect = useCallback(
    (index: number) => {
      if (!api) return;
      api.scrollTo(index);
    },
    [api],
  );

  const onInit = useCallback((api: CarouselApi) => {
    if (!api) return;
    setScrollSnaps(api.scrollSnapList());
    setSelectedIndex(api.selectedScrollSnap());
  }, []);

  const onSelectCallback = useCallback((api: CarouselApi) => {
    if (!api) return;
    setSelectedIndex(api.selectedScrollSnap());
    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());
  }, []);

  const scrollPrev = useCallback(() => {
    api?.scrollPrev();
  }, [api]);

  const scrollNext = useCallback(() => {
    api?.scrollNext();
  }, [api]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollNext();
      }
    },
    [scrollPrev, scrollNext],
  );

  useEffect(() => {
    if (!api || !setApi) return;
    setApi(api);
  }, [api, setApi]);

  useEffect(() => {
    if (!api) return;
    onInit(api);
    onSelectCallback(api);
    api.on("reInit", onInit);
    api.on("reInit", onSelectCallback);
    api.on("select", onSelectCallback);
    return () => {
      api.off("reInit", onInit);
      api.off("reInit", onSelectCallback);
      api.off("select", onSelectCallback);
    };
  }, [api, onInit, onSelectCallback]);

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api,
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
        selectedIndex,
        scrollSnaps,
        onSelect,
      }}
    >
      <div
        onKeyDownCapture={handleKeyDown}
        className={cn("relative", className)}
        role="region"
        aria-roledescription="carousel"
        data-slot="carousel"
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  );
}

function CarouselContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const { carouselRef } = useCarousel();

  return (
    <div
      ref={carouselRef}
      className="overflow-hidden"
      data-slot="carousel-content"
    >
      <div className={cn("flex", className)} {...props} />
    </div>
  );
}

function CarouselItem({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="group"
      aria-roledescription="slide"
      data-slot="carousel-item"
      className={cn("min-w-0 shrink-0 grow-0 basis-full", className)}
      {...props}
    />
  );
}

type CarouselPreviousProps = ComponentProps<typeof Button>;

function CarouselPrevious({
  className,
  variant = "ghost",
  size = "icon-sm",
  ...props
}: CarouselPreviousProps) {
  const { scrollPrev, canScrollPrev } = useCarousel();

  return (
    <Button
      data-slot="carousel-previous"
      variant={variant}
      size={size}
      className={cn("rounded-full", className)}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ArrowLeft className="size-3.5" />
      <span className="sr-only">Previous slide</span>
    </Button>
  );
}

type CarouselNextProps = ComponentProps<typeof Button>;

function CarouselNext({
  className,
  variant = "ghost",
  size = "icon-sm",
  ...props
}: CarouselNextProps) {
  const { scrollNext, canScrollNext } = useCarousel();

  return (
    <Button
      data-slot="carousel-next"
      variant={variant}
      size={size}
      className={cn("rounded-full", className)}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ArrowRight className="size-3.5" />
      <span className="sr-only">Next slide</span>
    </Button>
  );
}

function CarouselDots({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { selectedIndex, scrollSnaps, onSelect } = useCarousel();

  if (scrollSnaps.length <= 1) return null;

  return (
    <div
      data-slot="carousel-dots"
      className={cn("flex items-center gap-1.5", className)}
      {...props}
    >
      {scrollSnaps.map((_, index) => (
        <button
          key={index}
          type="button"
          className={cn(
            "size-1.5 rounded-full transition-all",
            index === selectedIndex
              ? "bg-foreground w-4"
              : "bg-foreground/30 hover:bg-foreground/50",
          )}
          onClick={() => onSelect(index)}
          aria-label={`Go to slide ${index + 1}`}
        />
      ))}
    </div>
  );
}

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  CarouselDots,
  type CarouselApi,
};
