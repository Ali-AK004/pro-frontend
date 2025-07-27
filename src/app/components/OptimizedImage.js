"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";

// Optimized image component with lazy loading and error handling
const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className = "",
  fallbackSrc = "/images/placeholder.jpg",
  priority = false,
  quality = 75,
  placeholder = "blur",
  blurDataURL,
  onLoad = () => {},
  onError = () => {},
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(priority);
  const imgRef = useRef(null);

  // Generate blur data URL for placeholder
  const generateBlurDataURL = (w = 10, h = 10) => {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(0, 0, w, h);
    return canvas.toDataURL();
  };

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(imgRef.current);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [priority]);

  // Handle image load
  const handleLoad = (event) => {
    setIsLoading(false);
    onLoad(event);
  };

  // Handle image error
  const handleError = (event) => {
    setImageError(true);
    setIsLoading(false);
    if (imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
    }
    onError(event);
  };

  // Reset error state when src changes
  useEffect(() => {
    if (src !== imageSrc && !imageError) {
      setImageSrc(src);
      setImageError(false);
      setIsLoading(true);
    }
  }, [src]);

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden rounded-2xl ${className}`}
    >
      {/* Enhanced Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer flex items-center justify-center">
          <div className="relative">
            <div className="w-12 h-12 bg-white/50 backdrop-blur-sm rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-gray-500 animate-pulse"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            {/* Loading dots */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-100"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-200"></div>
            </div>
          </div>
        </div>
      )}

      {/* Actual image */}
      {isVisible && (
        <Image
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          quality={quality}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={blurDataURL || generateBlurDataURL()}
          onLoad={handleLoad}
          onError={handleError}
          className={`transition-opacity duration-300 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
          {...props}
        />
      )}

      {/* Error state */}
      {imageError && imageSrc === fallbackSrc && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <svg
              className="w-12 h-12 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm">فشل تحميل الصورة</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Avatar component with optimized loading
export const OptimizedAvatar = ({
  src,
  alt,
  size = 64,
  className = "",
  fallbackIcon = null,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);

  const handleError = () => {
    setImageError(true);
  };

  return (
    <div
      className={`relative rounded-full overflow-hidden bg-gray-200 flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {!imageError && src ? (
        <OptimizedImage
          src={src}
          alt={alt}
          width={size}
          height={size}
          className="rounded-full"
          onError={handleError}
          {...props}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          {fallbackIcon || (
            <svg
              className="w-1/2 h-1/2"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          )}
        </div>
      )}
    </div>
  );
};

// Gallery component with optimized loading
export const OptimizedGallery = ({
  images,
  className = "",
  itemClassName = "",
}) => {
  const [loadedImages, setLoadedImages] = useState(new Set());

  const handleImageLoad = (index) => {
    setLoadedImages((prev) => new Set([...prev, index]));
  };

  return (
    <div className={`grid gap-4 ${className}`}>
      {images.map((image, index) => (
        <div key={index} className={`relative ${itemClassName}`}>
          <OptimizedImage
            src={image.src}
            alt={image.alt || `Image ${index + 1}`}
            width={image.width || 300}
            height={image.height || 200}
            onLoad={() => handleImageLoad(index)}
            className="w-full h-full object-cover"
          />

          {/* Loading indicator */}
          {!loadedImages.has(index) && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}
        </div>
      ))}
    </div>
  );
};

// Hook for preloading images
export const useImagePreloader = (imageUrls) => {
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!imageUrls || imageUrls.length === 0) {
      setIsLoading(false);
      return;
    }

    const preloadImage = (url) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject(url);
        img.src = url;
      });
    };

    const preloadAll = async () => {
      try {
        const promises = imageUrls.map((url) => preloadImage(url));
        const results = await Promise.allSettled(promises);

        const loaded = new Set();
        results.forEach((result, index) => {
          if (result.status === "fulfilled") {
            loaded.add(imageUrls[index]);
          }
        });

        setLoadedImages(loaded);
      } catch (error) {
        console.error("Error preloading images:", error);
      } finally {
        setIsLoading(false);
      }
    };

    preloadAll();
  }, [imageUrls]);

  return { loadedImages, isLoading };
};

export default OptimizedImage;
