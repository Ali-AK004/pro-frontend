"use client";
import { useEffect, useState } from 'react';

const PerformanceMonitor = ({ enabled = process.env.NODE_ENV === 'development' }) => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    apiCalls: 0,
    slowQueries: [],
    memoryUsage: 0,
  });
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!enabled) return;

    const measureLoadTime = () => {
      if (typeof window !== 'undefined' && window.performance) {
        const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
        setMetrics(prev => ({ ...prev, loadTime }));
      }
    };

    const measureRenderTime = () => {
      if (typeof window !== 'undefined' && window.performance) {
        const renderTime = window.performance.timing.domContentLoadedEventEnd - window.performance.timing.domLoading;
        setMetrics(prev => ({ ...prev, renderTime }));
      }
    };

    const measureMemoryUsage = () => {
      if (typeof window !== 'undefined' && window.performance && window.performance.memory) {
        const memoryUsage = window.performance.memory.usedJSHeapSize / 1024 / 1024; // MB
        setMetrics(prev => ({ ...prev, memoryUsage: Math.round(memoryUsage) }));
      }
    };

    measureLoadTime();
    measureRenderTime();
    measureMemoryUsage();

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

        if (duration > 1000) {
          slowQueries.push({
            url: typeof args[0] === 'string' ? args[0] : String(args[0]),
            duration: Math.round(duration),
            timestamp: new Date().toISOString(),
          });
        }

        setMetrics(prev => ({
          ...prev,
          apiCalls: apiCallCount,
          slowQueries: [...slowQueries],
        }));

        return response;
      } catch (error) {
        throw error;
      }
    };

    const memoryInterval = setInterval(measureMemoryUsage, 5000);

    return () => {
      window.fetch = originalFetch;
      clearInterval(memoryInterval);
    };
  }, [enabled]);

  if (!enabled || !isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-black bg-opacity-80 text-white p-3 rounded-lg text-xs font-mono z-50 max-w-xs">
      <div className="flex justify-between items-center mb-2">
        <div className="font-bold">Performance Monitor</div>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
          aria-label="Close monitor"
        >
          ×
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <div>Load Time:</div>
        <div className="text-right">{metrics.loadTime}ms</div>
        
        <div>Render Time:</div>
        <div className="text-right">{metrics.renderTime}ms</div>
        
        <div>API Calls:</div>
        <div className="text-right">{metrics.apiCalls}</div>
        
        <div>Memory Usage:</div>
        <div className="text-right">{metrics.memoryUsage}MB</div>
      </div>

      {metrics.slowQueries.length > 0 && (
        <div className="mt-3 pt-2 border-t border-gray-700">
          <div className="text-yellow-300 mb-1">
            Slow Queries ({metrics.slowQueries.length})
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {metrics.slowQueries.slice(-3).map((query, index) => (
              <div key={index} className="truncate">
                <span className="text-red-400">{query.duration}ms</span>: {query.url.split('/').pop()}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile-specific adjustments */}
      <style jsx>{`
        @media (max-width: 640px) {
          .max-w-xs {
            max-width: 90vw;
            left: 50%;
            transform: translateX(-50%);
            bottom: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default PerformanceMonitor;