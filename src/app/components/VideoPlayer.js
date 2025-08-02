// Video Player Component with Bunny.net Integration
// =================================================

import React, { useRef, useEffect, useState } from 'react';
import { getVideoUrl } from '../../config/api';

const VideoPlayer = ({
  src,
  poster,
  width = '100%',
  height = 'auto',
  autoplay = false,
  muted = false,
  controls = true,
  loop = false,
  preload = 'metadata',
  className = '',
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  onLoadedMetadata,
  onError,
  watermark = true,
  responsive = true,
  ...props
}) => {
  const videoRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Get optimized video URL
  const getOptimizedVideoUrl = (videoSrc) => {
    if (!videoSrc) return '';
    
    // If it's already a full URL, return as is
    if (videoSrc.startsWith('http://') || videoSrc.startsWith('https://')) {
      return videoSrc;
    }
    
    return getVideoUrl(videoSrc);
  };

  // Convert Bunny.net play URL to embed URL for iframe player
  const convertToEmbedUrl = (playUrl) => {
    if (!playUrl || !playUrl.includes('/play/')) {
      return playUrl;
    }
    
    let embedUrl = playUrl.replace('/play/', '/embed/');
    
    // Add query parameters for player options
    const params = new URLSearchParams();
    if (autoplay) params.append('autoplay', 'true');
    if (muted) params.append('muted', 'true');
    if (loop) params.append('loop', 'true');
    if (!controls) params.append('controls', 'false');
    if (watermark) params.append('watermark', 'true');
    
    const queryString = params.toString();
    if (queryString) {
      embedUrl += `?${queryString}`;
    }
    
    return embedUrl;
  };

  const optimizedSrc = getOptimizedVideoUrl(src);
  const embedUrl = convertToEmbedUrl(optimizedSrc);

  // Event handlers
  const handleLoadedMetadata = (event) => {
    setIsLoading(false);
    setDuration(event.target.duration);
    if (onLoadedMetadata) {
      onLoadedMetadata(event);
    }
  };

  const handleTimeUpdate = (event) => {
    setCurrentTime(event.target.currentTime);
    if (onTimeUpdate) {
      onTimeUpdate(event);
    }
  };

  const handlePlay = (event) => {
    setIsPlaying(true);
    if (onPlay) {
      onPlay(event);
    }
  };

  const handlePause = (event) => {
    setIsPlaying(false);
    if (onPause) {
      onPause(event);
    }
  };

  const handleEnded = (event) => {
    setIsPlaying(false);
    if (onEnded) {
      onEnded(event);
    }
  };

  const handleError = (event) => {
    setHasError(true);
    setIsLoading(false);
    if (onError) {
      onError(event);
    }
  };

  // Format time for display
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Check if we should use iframe embed (for Bunny.net hosted videos)
  const shouldUseIframe = optimizedSrc && (
    optimizedSrc.includes('iframe.mediadelivery.net') ||
    optimizedSrc.includes('bunnycdn.com') ||
    embedUrl !== optimizedSrc
  );

  if (shouldUseIframe) {
    // Use Bunny.net iframe player
    return (
      <div className={`relative ${responsive ? 'aspect-video' : ''} ${className}`}>
        {isLoading && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>جاري تحميل الفيديو...</p>
            </div>
          </div>
        )}
        
        <iframe
          src={embedUrl}
          width={responsive ? '100%' : width}
          height={responsive ? '100%' : height}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className={`${responsive ? 'absolute inset-0 w-full h-full' : ''}`}
          onLoad={() => setIsLoading(false)}
          onError={handleError}
          {...props}
        />
      </div>
    );
  }

  // Use HTML5 video player
  return (
    <div className={`relative ${responsive ? 'aspect-video' : ''} ${className}`}>
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>جاري تحميل الفيديو...</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
          <div className="text-white text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>فشل في تحميل الفيديو</p>
            <button 
              onClick={() => {
                setHasError(false);
                setIsLoading(true);
                if (videoRef.current) {
                  videoRef.current.load();
                }
              }}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        src={optimizedSrc}
        poster={poster}
        width={responsive ? '100%' : width}
        height={responsive ? '100%' : height}
        autoPlay={autoplay}
        muted={muted}
        controls={controls}
        loop={loop}
        preload={preload}
        className={`${responsive ? 'w-full h-full object-cover' : ''}`}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onError={handleError}
        {...props}
      >
        <p className="text-white">
          متصفحك لا يدعم تشغيل الفيديو. 
          <a href={optimizedSrc} className="underline">انقر هنا لتحميل الفيديو</a>
        </p>
      </video>

      {/* Custom watermark overlay */}
      {watermark && (
        <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
          Academitna
        </div>
      )}

      {/* Progress indicator */}
      {!controls && duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-gray-800 bg-opacity-75 p-2">
          <div className="flex items-center justify-between text-white text-sm mb-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div className="w-full bg-gray-600 rounded-full h-1">
            <div 
              className="bg-blue-600 h-1 rounded-full transition-all duration-300"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Video thumbnail component
export const VideoThumbnail = ({
  src,
  poster,
  alt,
  className = '',
  onPlay,
  showPlayButton = true,
  ...props
}) => {
  return (
    <div className={`relative cursor-pointer group ${className}`} onClick={onPlay}>
      <img
        src={poster}
        alt={alt}
        className="w-full h-full object-cover rounded-lg"
        {...props}
      />
      
      {showPlayButton && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-50 transition-all duration-300 rounded-lg">
          <div className="bg-white bg-opacity-90 rounded-full p-4 group-hover:scale-110 transition-transform duration-300">
            <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      )}
      
      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
        فيديو
      </div>
    </div>
  );
};

export default VideoPlayer;
