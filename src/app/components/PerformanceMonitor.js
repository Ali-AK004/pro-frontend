"use client";
import { useEffect, useState } from "react";

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    apiCalls: 0,
    slowQueries: [],
  });

  useEffect(() => {
    // Monitor page load performance
    const measureLoadTime = () => {
      if (typeof window !== "undefined" && window.performance) {
        const navigation = performance.getEntriesByType("navigation")[0];
        if (navigation) {
          const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
          setMetrics((prev) => ({ ...prev, loadTime }));
        }
      }
    };

    // Monitor render performance
    const measureRenderTime = () => {
      const startTime = performance.now();

      // Use requestAnimationFrame to measure actual render time
      requestAnimationFrame(() => {
        const renderTime = performance.now() - startTime;
        setMetrics((prev) => ({ ...prev, renderTime }));
      });
    };

    measureLoadTime();
    measureRenderTime();

    // Monitor API calls
    const originalFetch = window.fetch;
    let apiCallCount = 0;
    const slowQueries = [];

    window.fetch = async (...args) => {
      const startTime = performance.now();
      apiCallCount++;

      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;

        // Track slow queries (> 1 second)
        if (duration > 1000) {
          slowQueries.push({
            url: typeof args[0] === "string" ? args[0] : String(args[0]),
            duration,
            timestamp: new Date().toISOString(),
          });
        }

        setMetrics((prev) => ({
          ...prev,
          apiCalls: apiCallCount,
          slowQueries: [...slowQueries],
        }));

        return response;
      } catch (error) {
        throw error;
      }
    };

    // Cleanup
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return metrics;
};

// Component for displaying performance metrics (ADMIN only)
const PerformanceMonitor = ({ user }) => {
  const metrics = usePerformanceMonitor();
  const [showMetrics, setShowMetrics] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize(); // Set initial value
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Only show for ADMIN users
  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div
      className={`fixed ${isMobile ? "bottom-2 right-2" : "bottom-4 right-4"} z-50`}
    >
      <button
        onClick={() => setShowMetrics(!showMetrics)}
        className={`group cursor-pointer bg-gradient-to-r from-blue-500 to-purple-600 text-white ${
          isMobile
            ? "px-3 py-2 rounded-xl text-xs"
            : "px-4 py-3 rounded-2xl text-sm"
        } font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-2`}
      >
        <span className={isMobile ? "text-sm" : "text-lg"}>📊</span>
        {!isMobile && <span>Performance</span>}
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
      </button>

      {showMetrics && (
        <div
          className={`
          absolute ${isMobile ? "bottom-12 right-0" : "bottom-16 right-0"}
          bg-white/95 backdrop-blur-md border border-gray-200/50 rounded-2xl shadow-2xl
          ${isMobile ? "p-3 min-w-[280px] max-w-[90vw]" : "p-6 min-w-80 max-w-sm"}
        `}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`${isMobile ? "w-6 h-6" : "w-8 h-8"} bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center`}
            >
              <span className="text-white text-sm">📊</span>
            </div>
            <h3
              className={`font-bold ${isMobile ? "text-base" : "text-lg"} text-gray-900`}
            >
              Performance Metrics
            </h3>
          </div>

          <div className="space-y-4">
            {/* Load Time */}
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex justify-between items-center mb-2">
                <span
                  className={`${isMobile ? "text-xs" : "text-sm"} font-medium text-gray-700`}
                >
                  Load Time
                </span>
                <span
                  className={`${isMobile ? "text-xs px-1 py-0.5" : "text-sm px-2 py-1"} font-bold rounded-lg ${
                    metrics.loadTime > 3000
                      ? "text-red-600 bg-red-100"
                      : metrics.loadTime > 1000
                        ? "text-yellow-600 bg-yellow-100"
                        : "text-green-600 bg-green-100"
                  }`}
                >
                  {metrics.loadTime.toFixed(0)}ms
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    metrics.loadTime > 3000
                      ? "bg-red-500"
                      : metrics.loadTime > 1000
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }`}
                  style={{
                    width: `${Math.min((metrics.loadTime / 5000) * 100, 100)}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Render Time */}
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex justify-between items-center mb-2">
                <span
                  className={`${isMobile ? "text-xs" : "text-sm"} font-medium text-gray-700`}
                >
                  Render Time
                </span>
                <span
                  className={`${isMobile ? "text-xs px-1 py-0.5" : "text-sm px-2 py-1"} font-bold rounded-lg ${
                    metrics.renderTime > 16
                      ? "text-red-600 bg-red-100"
                      : metrics.renderTime > 8
                        ? "text-yellow-600 bg-yellow-100"
                        : "text-green-600 bg-green-100"
                  }`}
                >
                  {metrics.renderTime.toFixed(2)}ms
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    metrics.renderTime > 16
                      ? "bg-red-500"
                      : metrics.renderTime > 8
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }`}
                  style={{
                    width: `${Math.min((metrics.renderTime / 32) * 100, 100)}%`,
                  }}
                ></div>
              </div>
            </div>

            <div
              className={`flex justify-between ${isMobile ? "text-xs" : "text-sm"}`}
            >
              <span>API Calls:</span>
              <span>{metrics.apiCalls}</span>
            </div>

            <div
              className={`flex justify-between ${isMobile ? "text-xs" : "text-sm"}`}
            >
              <span>Slow Queries:</span>
              <span
                className={
                  metrics.slowQueries.length > 0
                    ? "text-red-500"
                    : "text-green-500"
                }
              >
                {metrics.slowQueries.length}
              </span>
            </div>

            {metrics.slowQueries.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div
                  className={`${isMobile ? "text-xs" : "text-sm"} font-semibold mb-1`}
                >
                  Slow Queries:
                </div>
                {metrics.slowQueries.slice(-3).map((query, index) => (
                  <div
                    key={index}
                    className={`${isMobile ? "text-xs" : "text-sm"} text-red-600 truncate`}
                  >
                    {String(query.url).split("/").pop()}:{" "}
                    {query.duration.toFixed(0)}ms
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Wrapper component that accesses user context
export const AdminPerformanceMonitor = () => {
  // This will be imported and used in layout.js
  return null; // Placeholder - will be replaced by the actual implementation in layout.js
};

export default PerformanceMonitor;
