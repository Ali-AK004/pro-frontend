"use client";
import { useRef, useState } from "react";
import {
  FaPause,
  FaPlay,
  FaVolumeMute,
  FaVolumeUp,
  FaExpand,
} from "react-icons/fa";
import { IoIosSpeedometer } from "react-icons/io";
import { IoSettingsSharp } from "react-icons/io5";
import ReactPlayer from "react-player";
import screenfull from "screenfull";

const CustomVideoPlayer = ({ videoUrl, onEnded, poster }) => {
  const playerRef = useRef(null);
  const playerContainerRef = useRef(null);
  const progressRef = useRef(null);
  const [volume, setVolume] = useState(0.8);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [speedValue, setSpeedValue] = useState("1x");
  const [openSettings, setOpenSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Extract YouTube ID from URL
  const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const youtubeId = getYouTubeId(videoUrl);
  const embedUrl = youtubeId
    ? `https://www.youtube.com/embed/${youtubeId}`
    : null;

  // Format time (seconds to MM:SS)
  const formatTime = (seconds) => {
    const date = new Date(seconds * 1000);
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };

  // Player event handlers
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handlePlaybackRateChange = (rate) => {
    setPlaybackRate(rate);
    setSpeedValue(`${rate}x`);
    setOpenSettings(false);
  };

  const handleProgress = (state) => {
    if (!seeking) {
      setPlayed(state.played);
    }
  };

  const handleSeekMouseDown = () => {
    setSeeking(true);
  };

  const handleSeekChange = (e) => {
    const seekValue = parseFloat(e.target.value);
    setPlayed(seekValue);
  };

  const handleSeekMouseUp = (e) => {
    setSeeking(false);
    playerRef.current.seekTo(parseFloat(e.target.value));
  };

  const handleDuration = (duration) => {
    setDuration(duration);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(hideControlsTimeout.current);
    hideControlsTimeout.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const handleToggleFullscreen = () => {
    if (screenfull.isEnabled && playerContainerRef.current) {
      screenfull.toggle(playerContainerRef.current);
      setIsFullscreen(!isFullscreen);
    }
  };

  const hideControlsTimeout = useRef();

  if (!embedUrl) {
    return (
      <div className="w-full aspect-video bg-black flex items-center justify-center rounded-lg text-white">
        <p>لا يتوفر فيديو لهذا الدرس</p>
      </div>
    );
  }

  return (
    <div
      ref={playerContainerRef}
      className="relative w-full aspect-video bg-black rounded-lg overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Overlay to prevent YouTube controls access */}
      <div className="absolute left-0 top-0 h-[65px] w-full cursor-not-allowed bg-transparent z-10" />

      {/* Click area for play/pause */}
      <div
        className="absolute left-0 top-[65px] w-full bg-transparent cursor-pointer z-10"
        style={{ height: "calc(100% - 120px)" }}
        onClick={handlePlayPause}
      />

      {/* Video Player */}
      <ReactPlayer
        ref={playerRef}
        url={embedUrl}
        playing={isPlaying}
        volume={isMuted ? 0 : volume}
        playbackRate={playbackRate}
        width="100%"
        height="100%"
        onProgress={handleProgress}
        onEnded={onEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        config={{
          youtube: {
            playerVars: {
              modestbranding: 1,
              showinfo: 0,
              rel: 0,
              fs: 0,
              disablekb: 1,
              iv_load_policy: 3,
              cc_load_policy: 0,
              controls: 0,
              autohide: 1,
              wmode: "opaque",
              origin:
                typeof window !== "undefined" ? window.location.origin : "",
            },
          },
          vimeo: {
            playerOptions: {
              controls: false,
              title: false,
              byline: false,
              portrait: false,
            },
          },
          dailymotion: {
            params: {
              controls: false,
              "ui-highlight": "fff",
              "ui-logo": false,
            },
          },
          facebook: {
            appId: "your-app-id",
          },
        }}
        onDuration={handleDuration} // This is actually correct, keep it
      />

      {/* Custom Controls */}
      {showControls && (
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent">
          {/* Progress Bar */}
          <div className="px-2 pb-1">
            <div className="relative h-1 w-full bg-gray-600 rounded-full">
              <input
                type="range"
                min={0}
                max={1}
                step="any"
                value={played}
                onChange={handleSeekChange}
                onMouseDown={handleSeekMouseDown}
                onMouseUp={handleSeekMouseUp}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div
                className="absolute h-full bg-red-600 rounded-full"
                style={{ width: `${played * 100}%` }}
              />
            </div>
          </div>

          {/* Bottom Controls Bar */}
          <div className="flex items-center justify-between px-4 py-2">
            {/* Left Controls */}
            <div className="flex items-center space-x-4">
              {/* Play/Pause Button */}
              <button
                onClick={handlePlayPause}
                className="text-white text-lg"
                aria-label={isPlaying ? "إيقاف" : "تشغيل"}
              >
                {isPlaying ? <FaPause /> : <FaPlay />}
              </button>

              {/* Volume Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleToggleMute}
                  className="text-white text-lg"
                  aria-label={isMuted ? "إلغاء كتم الصوت" : "كتم الصوت"}
                >
                  {isMuted || volume === 0 ? <FaVolumeMute /> : <FaVolumeUp />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 accent-red-600 cursor-pointer"
                />
              </div>

              {/* Time Display */}
              <div className="text-white text-sm font-medium">
                {formatTime(duration * played)} / {formatTime(duration)}
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-4">
              {/* Playback Speed */}
              <div className="relative">
                <button
                  onClick={() => setOpenSettings(!openSettings)}
                  className="text-white text-lg"
                  aria-label="إعدادات السرعة"
                >
                  <IoSettingsSharp />
                </button>
                {openSettings && (
                  <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-md p-2 shadow-lg">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => handlePlaybackRateChange(rate)}
                        className={`block w-full text-right px-3 py-1 text-white hover:bg-red-600 rounded ${
                          playbackRate === rate ? "bg-red-600" : ""
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen Button */}
              <button
                onClick={handleToggleFullscreen}
                className="text-white text-lg"
                aria-label="ملء الشاشة"
              >
                <FaExpand />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Play/Pause Overlay */}
      {!isPlaying && (
        <button
          onClick={handlePlayPause}
          className="absolute inset-0 flex items-center justify-center w-full h-full bg-black/30"
          aria-label="تشغيل"
        >
          <FaPlay className="text-white text-4xl" />
        </button>
      )}
    </div>
  );
};

export default CustomVideoPlayer;
