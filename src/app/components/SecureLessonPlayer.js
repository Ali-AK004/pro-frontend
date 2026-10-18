"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { studentAPI } from "@/app/services/studentAPI";

/**
 * Protected lesson player.
 *
 * What it does (layered, because no web page can fully block screen recording):
 * 1. The video URL is requested only when the student presses Play. The server checks access,
 *    counts one view atomically and returns a signed Bunny URL that expires.
 * 2. With Bunny Enterprise DRM (Widevine / FairPlay) enabled on the library, recordings come out
 *    black on devices with hardware DRM (Safari, Chrome/Edge on Windows, most Android phones).
 * 3. A moving watermark (name, masked phone, user id, session id) plus a faint tiled pattern is
 *    drawn over the video, including in fullscreen, so any leaked recording identifies the student.
 * 4. The video is hidden and paused when the tab is hidden, the window loses focus, or the
 *    PrintScreen key is pressed. Right click, drag and text selection are disabled.
 */
const playerMessage = (iframe, method) => {
  try {
    iframe?.contentWindow?.postMessage(
      JSON.stringify({ context: "player.js", version: "0.0.11", method }),
      "*"
    );
  } catch {
    // ignore: player not ready
  }
};

export default function SecureLessonPlayer({ lessonId, remainingViews, onViewsChanged }) {
  const containerRef = useRef(null);
  const iframeRef = useRef(null);
  const watermarkRef = useRef(null);
  const [playback, setPlayback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shielded, setShielded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tiles, setTiles] = useState([]);

  const start = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await studentAPI.lessons.startPlayback(lessonId);
      setPlayback(data);
      if (typeof data.remainingVideoViews === "number" && data.remainingVideoViews >= 0) {
        onViewsChanged?.(data.remainingVideoViews);
      }
    } catch (e) {
      setError(e?.response?.data?.message || e?.response?.data?.error || "تعذر تشغيل الفيديو");
    } finally {
      setLoading(false);
    }
  };

  // Hide + pause the video whenever the page is not in front of the student
  const shield = useCallback(() => {
    setShielded(true);
    playerMessage(iframeRef.current, "pause");
  }, []);

  useEffect(() => {
    if (!playback) return;
    const onVisibility = () => (document.hidden ? shield() : null);
    const onBlur = () => shield();
    const onKey = (e) => {
      const key = (e.key || "").toLowerCase();
      if (key === "printscreen" || (e.metaKey && e.shiftKey) || (e.ctrlKey && key === "p")) {
        shield();
        try {
          navigator.clipboard?.writeText(" ");
        } catch {
          // ignore
        }
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("keyup", onKey);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("keyup", onKey);
      window.removeEventListener("keydown", onKey);
    };
  }, [playback, shield]);

  // Moving watermark: random jumps plus slow drift, so it cannot be cropped or blurred out
  useEffect(() => {
    if (!playback || !watermarkRef.current || !containerRef.current) return;
    let frame;
    let x = 20;
    let y = 20;
    let dx = 0.6;
    let dy = 0.45;
    let lastJump = performance.now();
    const step = (now) => {
      const box = containerRef.current;
      const mark = watermarkRef.current;
      if (!box || !mark) return;
      const maxX = Math.max(0, box.clientWidth - mark.offsetWidth - 8);
      const maxY = Math.max(0, box.clientHeight - mark.offsetHeight - 8);
      if (now - lastJump > 7000) {
        x = Math.random() * maxX;
        y = Math.random() * maxY;
        lastJump = now;
      }
      x += dx;
      y += dy;
      if (x <= 4 || x >= maxX) dx = -dx;
      if (y <= 4 || y >= maxY) dy = -dy;
      x = Math.min(Math.max(4, x), maxX);
      y = Math.min(Math.max(4, y), maxY);
      mark.style.transform = `translate(${x}px, ${y}px)`;
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [playback, isFullscreen]);

  // Faint tiled watermark that reshuffles every few seconds
  useEffect(() => {
    if (!playback) return;
    const shuffle = () =>
      setTiles(
        Array.from({ length: 6 }, () => ({
          left: `${Math.round(Math.random() * 80)}%`,
          top: `${Math.round(Math.random() * 85)}%`,
          rotate: Math.round(Math.random() * 40 - 20),
        }))
      );
    shuffle();
    const id = setInterval(shuffle, 4000);
    return () => clearInterval(id);
  }, [playback]);

  // Our own fullscreen on the wrapper, so the watermark stays visible in fullscreen
  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (el.requestFullscreen) {
        await el.requestFullscreen();
        try {
          await screen.orientation?.lock?.("landscape");
        } catch {
          // not supported on this device
        }
      } else {
        setIsFullscreen((v) => !v); // iOS Safari: CSS fullscreen fallback
      }
    } catch {
      setIsFullscreen((v) => !v);
    }
  };

  const block = (e) => e.preventDefault();

  if (!playback) {
    return (
      <div className="w-full aspect-video bg-black rounded-lg flex flex-col items-center justify-center gap-3 text-white p-4 text-center">
        {error ? <p className="text-red-300">{error}</p> : null}
        <button
          onClick={start}
          disabled={loading || remainingViews === 0}
          className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 px-6 py-3 rounded-lg font-bold"
        >
          {loading ? "جاري التحميل..." : "تشغيل الفيديو"}
        </button>
        {typeof remainingViews === "number" && remainingViews >= 0 ? (
          <p className="text-sm text-gray-300">
            سيتم احتساب مشاهدة واحدة عند التشغيل — المتبقي: {remainingViews}
          </p>
        ) : null}
      </div>
    );
  }

  const fallbackFullscreen = isFullscreen && !document.fullscreenElement;

  return (
    <div>
      <div
        ref={containerRef}
        onContextMenu={block}
        onDragStart={block}
        className={`relative bg-black overflow-hidden select-none ${
          fallbackFullscreen ? "fixed inset-0 z-[9999]" : "w-full aspect-video rounded-lg"
        }`}
        style={{ WebkitUserSelect: "none", WebkitTouchCallout: "none" }}
      >
        <iframe
          ref={iframeRef}
          src={playback.embedUrl}
          title="Lesson video"
          allow="accelerometer; gyroscope; encrypted-media; picture-in-picture"
          className="absolute inset-0 w-full h-full border-0"
          referrerPolicy="strict-origin-when-cross-origin"
        />

        {/* Tiled faint watermark */}
        {tiles.map((t, i) => (
          <span
            key={i}
            className="absolute pointer-events-none whitespace-nowrap text-white"
            style={{
              left: t.left,
              top: t.top,
              opacity: 0.12,
              fontSize: "0.75rem",
              transform: `rotate(${t.rotate}deg)`,
              zIndex: 20,
            }}
          >
            {playback.watermark}
          </span>
        ))}

        {/* Moving watermark */}
        <div
          ref={watermarkRef}
          className="absolute left-0 top-0 pointer-events-none whitespace-nowrap text-white font-mono"
          style={{
            opacity: 0.45,
            fontSize: "0.8rem",
            textShadow: "0 0 2px #000",
            background: "rgba(0,0,0,0.25)",
            padding: "2px 6px",
            borderRadius: 4,
            zIndex: 21,
          }}
        >
          {playback.watermark}
        </div>

        {/* Shield: shown when the page loses focus or a screenshot key is pressed */}
        {shielded ? (
          <div className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-3 text-white z-30 p-4 text-center">
            <p className="font-bold">تم إيقاف العرض مؤقتًا لحماية المحتوى</p>
            <button
              onClick={() => setShielded(false)}
              className="bg-brand-600 hover:bg-brand-700 px-5 py-2 rounded-lg"
            >
              متابعة المشاهدة
            </button>
          </div>
        ) : null}

        <button
          onClick={toggleFullscreen}
          className="absolute bottom-2 left-2 z-40 bg-black/60 text-white text-xs px-3 py-1 rounded"
        >
          {isFullscreen ? "خروج من ملء الشاشة" : "ملء الشاشة"}
        </button>
      </div>

      {!playback.drm ? null : (
        <p className="text-xs text-gray-500 mt-2">
          هذا الفيديو محمي بتقنية DRM. إذا ظهرت شاشة سوداء، استخدم أحدث إصدار من Chrome أو Edge أو Safari.
        </p>
      )}
      <p className="text-xs text-gray-500 mt-1">
        تسجيل الشاشة أو مشاركة المحتوى مخالف لشروط الاستخدام، والعلامة المائية تحدد هوية الحساب.
      </p>
    </div>
  );
}
