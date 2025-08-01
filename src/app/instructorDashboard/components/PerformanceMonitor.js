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

  useEffect(() => {
    if (!enabled) return;

    // Monitor page load time
    const measureLoadTime = () => {
      if (typeof window !== 'undefined' && window.performance) {
        const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
        setMetrics(prev => ({ ...prev, loadTime }));
      }
    };

    // Monitor render time
    const measureRenderTime = () => {
      if (typeof window !== 'undefined' && window.performance) {
        const renderTime = window.performance.timing.domContentLoadedEventEnd - window.performance.timing.domLoading;
        setMetrics(prev => ({ ...prev, renderTime }));
      }
    };

    // Monitor memory usage
    const measureMemoryUsage = () => {
      if (typeof window !== 'undefined' && window.performance && window.performance.memory) {
        const memoryUsage = window.performance.memory.usedJSHeapSize / 1024 / 1024; // MB
        setMetrics(prev => ({ ...prev, memoryUsage: Math.round(memoryUsage) }));
      }
    };

    measureLoadTime();
    measureRenderTime();
    measureMemoryUsage();

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

    // Update memory usage periodically
    const memoryInterval = setInterval(measureMemoryUsage, 5000);

    // Cleanup
    return () => {
      window.fetch = originalFetch;
      clearInterval(memoryInterval);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-black bg-opacity-80 text-white p-3 rounded-lg text-xs font-mono z-50 max-w-xs">
      <div className="font-bold mb-2">Performance Monitor</div>
      <div>Load: {metrics.loadTime}ms</div>
      <div>Render: {metrics.renderTime}ms</div>
      <div>API Calls: {metrics.apiCalls}</div>
      <div>Memory: {metrics.memoryUsage}MB</div>
      {metrics.slowQueries.length > 0 && (
        <div className="mt-2 text-yellow-300">
          <div>Slow Queries: {metrics.slowQueries.length}</div>
          {metrics.slowQueries.slice(-3).map((query, index) => (
            <div key={index} className="truncate">
              {query.duration}ms: {query.url.split('/').pop()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;
