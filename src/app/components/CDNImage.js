// CDN Image Component with Bunny.net Integration
// ===============================================

import React, { useState } from 'react';
import Image from 'next/image';
import { getImageUrl } from '../../config/api';

const CDNImage = ({
  src,
  alt,
  width,
  height,
  className = '',
  fallbackSrc = '/images/placeholder.jpg',
  priority = false,
  quality = 75,
  sizes,
  fill = false,
  style = {},
  onLoad,
  onError,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get CDN URL for the image
  const getOptimizedImageUrl = (imageSrc, options = {}) => {
    if (!imageSrc || imageError) {
      return fallbackSrc;
    }

    // If it's already a full URL, return as is
    if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
      return imageSrc;
    }

    // Get CDN URL
    const cdnUrl = getImageUrl(imageSrc);
    
    // Add optimization parameters for Bunny.net
    const params = new URLSearchParams();
    
    if (options.width) params.append('width', options.width);
    if (options.height) params.append('height', options.height);
    if (options.quality) params.append('quality', options.quality);
    if (options.format) params.append('format', options.format);
    
    const queryString = params.toString();
    return queryString ? `${cdnUrl}?${queryString}` : cdnUrl;
  };

  const handleImageLoad = (event) => {
    setIsLoading(false);
    if (onLoad) {
      onLoad(event);
    }
  };

  const handleImageError = (event) => {
    setImageError(true);
    setIsLoading(false);
    if (onError) {
      onError(event);
    }
  };

  // Optimization options
  const optimizationOptions = {
    width: width,
    height: height,
    quality: quality,
    format: 'webp' // Use WebP for better compression
  };

  const optimizedSrc = getOptimizedImageUrl(src, optimizationOptions);

  return (
    <div className={`relative ${className}`} style={style}>
      {/* Loading placeholder */}
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse rounded"
          style={{ width: width, height: height }}
        />
      )}
      
      {/* Main image */}
      <Image
        src={optimizedSrc}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        quality={quality}
        sizes={sizes}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        {...props}
      />
      
      {/* Error state */}
      {imageError && (
        <div 
          className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-400 text-sm"
          style={{ width: width, height: height }}
        >
          <div className="text-center">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>فشل تحميل الصورة</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Avatar component for user profile images
export const CDNAvatar = ({
  src,
  alt,
  size = 40,
  className = '',
  fallbackInitials = '؟',
  ...props
}) => {
  return (
    <div className={`relative rounded-full overflow-hidden ${className}`}>
      <CDNImage
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="rounded-full object-cover"
        fallbackSrc={`data:image/svg+xml;base64,${btoa(`
          <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#e5e7eb"/>
            <text x="50%" y="50%" text-anchor="middle" dy="0.3em" font-family="Arial" font-size="${size/2}" fill="#9ca3af">
              ${fallbackInitials}
            </text>
          </svg>
        `)}`}
        {...props}
      />
    </div>
  );
};

// Course thumbnail component
export const CourseThumbnail = ({
  src,
  alt,
  className = '',
  aspectRatio = '16/9',
  ...props
}) => {
  const aspectRatioClass = {
    '16/9': 'aspect-video',
    '4/3': 'aspect-4/3',
    '1/1': 'aspect-square',
    '3/2': 'aspect-3/2'
  };

  return (
    <div className={`relative ${aspectRatioClass[aspectRatio] || 'aspect-video'} ${className}`}>
      <CDNImage
        src={src}
        alt={alt}
        fill={true}
        className="object-cover rounded-lg"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        {...props}
      />
    </div>
  );
};

// Responsive image component
export const ResponsiveImage = ({
  src,
  alt,
  className = '',
  breakpoints = {
    sm: { width: 640, quality: 75 },
    md: { width: 768, quality: 80 },
    lg: { width: 1024, quality: 85 },
    xl: { width: 1280, quality: 90 }
  },
  ...props
}) => {
  // Generate sizes attribute
  const sizes = Object.entries(breakpoints)
    .map(([breakpoint, config]) => `(max-width: ${config.width}px) ${config.width}px`)
    .join(', ');

  return (
    <CDNImage
      src={src}
      alt={alt}
      className={className}
      sizes={sizes}
      {...props}
    />
  );
};

// Gallery image component with lightbox support
export const GalleryImage = ({
  src,
  alt,
  thumbnail = true,
  onImageClick,
  className = '',
  ...props
}) => {
  const handleClick = () => {
    if (onImageClick) {
      onImageClick(src, alt);
    }
  };

  return (
    <div 
      className={`cursor-pointer transition-transform hover:scale-105 ${className}`}
      onClick={handleClick}
    >
      <CDNImage
        src={src}
        alt={alt}
        className="rounded-lg shadow-md"
        quality={thumbnail ? 60 : 90}
        {...props}
      />
    </div>
  );
};

export default CDNImage;
