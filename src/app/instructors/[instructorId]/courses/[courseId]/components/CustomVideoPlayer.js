"use client";
import { useRef, useEffect, useState } from "react";
import { useUserData } from "../../../../../../../models/UserContext";

const convertBunnyUrl = (url) => {
  if (!url) return null;
  
  // Convert from play to embed format
  const embedUrl = url.replace('/play/', '/embed/');
  
  // Add required parameters
  return `${embedUrl}?autoplay=true&loop=false&muted=false&preload=true&responsive=true`;
};

const CustomVideoPlayer = ({ videoUrl }) => {
  const { user } = useUserData();
  const playerContainerRef = useRef(null);
  const watermarkRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  
  // Convert the URL
  const embedUrl = convertBunnyUrl(videoUrl);

  // Check if mobile on mount and on resize
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Track container dimensions
  useEffect(() => {
    if (!playerContainerRef.current) return;

    const updateDimensions = () => {
      if (playerContainerRef.current) {
        setContainerDimensions({
          width: playerContainerRef.current.clientWidth,
          height: playerContainerRef.current.clientHeight
        });
      }
    };

    // Initial measurement
    updateDimensions();

    // Set up ResizeObserver
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(playerContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Watermark animation
  useEffect(() => {
    if (!watermarkRef.current || !user?.id || !containerDimensions.width) return;

    const watermark = watermarkRef.current;
    const container = playerContainerRef.current;
    if (!container) return;

    // Get watermark dimensions
    const watermarkWidth = watermark.clientWidth;
    const watermarkHeight = watermark.clientHeight;

    // Calculate safe boundaries
    const maxX = containerDimensions.width - watermarkWidth;
    const maxY = containerDimensions.height - watermarkHeight;

    // Initial position (centered if first render)
    let posX = Math.max(10, Math.min(maxX - 10, maxX / 2));
    let posY = Math.max(10, Math.min(maxY - 10, maxY / 2));
    
    let directionX = 1;
    let directionY = 1;
    const speed = 0.4; // Slightly faster on mobile to compensate for smaller container

    const moveWatermark = () => {
      // Calculate new position
      posX += directionX * speed;
      posY += directionY * speed;

      // Check boundaries with buffer to prevent squishing
      if (posX >= maxX - 5) {
        directionX = -1;
        posX = maxX - 5;
      } else if (posX <= 5) {
        directionX = 1;
        posX = 5;
      }

      if (posY >= maxY - 5) {
        directionY = -1;
        posY = maxY - 5;
      } else if (posY <= 5) {
        directionY = 1;
        posY = 5;
      }

      // Apply new position
      watermark.style.left = `${posX}px`;
      watermark.style.top = `${posY}px`;

      requestAnimationFrame(moveWatermark);
    };

    // Set initial position
    watermark.style.left = `${posX}px`;
    watermark.style.top = `${posY}px`;

    const animationId = requestAnimationFrame(moveWatermark);
    return () => cancelAnimationFrame(animationId);
  }, [user?.id, isMobile, containerDimensions]);

  if (!embedUrl) {
    return (
      <div className="w-full aspect-video bg-black flex items-center justify-center rounded-lg text-white">
        <p>لا يتوفر فيديو لهذا الدرس</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile version - full width */}
      {isMobile && (
        <div className="fixed left-0 w-full" style={{ top: 'var(--header-height, 0)' }}>
          <div
            ref={playerContainerRef}
            className="relative w-full aspect-video bg-black"
          >
            <iframe
              src={embedUrl}
              title="Video Player"
              allow="accelerometer; gyroscope; autoplay; encrypted-media;"
              className="absolute top-0 left-0 w-full h-full border-0"
              allowFullScreen
              loading="lazy"
            />
            {/* User Watermark for mobile */}
            {user?.id && (
              <div
                ref={watermarkRef}
                className="absolute text-white/20 pointer-events-none whitespace-nowrap"
                style={{
                  fontSize: "0.6rem",
                  fontFamily: "monospace",
                  textShadow: "1px 1px 1px rgba(0,0,0,0.5)",
                  transition: "left 0.1s linear, top 0.1s linear",
                  zIndex: 10,
                  padding: "2px 4px",
                  backgroundColor: "rgba(0,0,0,0.2)",
                  borderRadius: "2px",
                }}
              >
                User: {user.fullname}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Desktop version - normal container */}
      {!isMobile && (
        <div
          ref={playerContainerRef}
          className="relative w-full aspect-video bg-black rounded-lg overflow-hidden"
        >
          <div className="relative w-full h-full">
            <iframe
              src={embedUrl}
              title="Video Player"
              allow="accelerometer; gyroscope; autoplay; encrypted-media;"
              className="absolute top-0 left-0 w-full h-full border-0"
              allowFullScreen
              loading="lazy"
            />
            {/* User Watermark for desktop */}
            {user?.id && (
              <div
                ref={watermarkRef}
                className="absolute text-white/20 pointer-events-none whitespace-nowrap"
                style={{
                  fontSize: "0.7rem",
                  fontFamily: "monospace",
                  textShadow: "1px 1px 1px rgba(0,0,0,0.5)",
                  transition: "left 0.1s linear, top 0.1s linear",
                  zIndex: 10,
                  padding: "2px 4px",
                  backgroundColor: "rgba(0,0,0,0.2)",
                  borderRadius: "2px",
                }}
              >
                User: {user.fullname}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CustomVideoPlayer;