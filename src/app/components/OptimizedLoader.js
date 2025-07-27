"use client";
import { useState, useEffect } from "react";

// Skeleton loader components for different content types
export const SkeletonCard = ({ className = "" }) => (
  <div className={`animate-pulse ${className}`}>
    <div className="bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-2xl h-48 mb-4"></div>
    <div className="space-y-3">
      <div className="bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer h-4 rounded-lg w-3/4"></div>
      <div className="bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer h-4 rounded-lg w-1/2"></div>
      <div className="bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer h-3 rounded-lg w-2/3"></div>
    </div>
  </div>
);

export const SkeletonList = ({ items = 3, className = "" }) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: items }).map((_, index) => (
      <div
        key={index}
        className="animate-pulse flex space-x-4 p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-100"
      >
        <div className="bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-full h-12 w-12"></div>
        <div className="flex-1 space-y-3 py-1">
          <div className="bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer h-4 rounded-lg w-3/4"></div>
          <div className="bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer h-3 rounded-lg w-1/2"></div>
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 4, className = "" }) => (
  <div
    className={`animate-pulse bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 overflow-hidden ${className}`}
  >
    {/* Table Header */}
    <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-4 border-b border-gray-200">
      <div className="flex space-x-4">
        {Array.from({ length: cols }).map((_, colIndex) => (
          <div
            key={colIndex}
            className="bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 bg-[length:200%_100%] animate-shimmer h-4 rounded-lg flex-1"
          ></div>
        ))}
      </div>
    </div>

    {/* Table Rows */}
    <div className="p-4 space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex space-x-4 p-3 bg-gray-50/50 rounded-xl"
        >
          {Array.from({ length: cols }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer h-4 rounded-lg flex-1"
            ></div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

// Progressive loading component
export const ProgressiveLoader = ({
  isLoading,
  error,
  children,
  skeleton,
  errorMessage = "حدث خطأ أثناء التحميل",
  retryAction = null,
}) => {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-red-500 mb-4">
          <svg
            className="w-16 h-16 mx-auto"
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
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          خطأ في التحميل
        </h3>
        <p className="text-gray-600 mb-4">{errorMessage}</p>
        {retryAction && (
          <button
            onClick={retryAction}
            className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
          >
            إعادة المحاولة
          </button>
        )}
      </div>
    );
  }

  if (isLoading) {
    return skeleton || <DefaultSkeleton />;
  }

  return children;
};

// Default skeleton loader
const DefaultSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="bg-gray-200 h-8 rounded w-1/4"></div>
    <div className="space-y-2">
      <div className="bg-gray-200 h-4 rounded"></div>
      <div className="bg-gray-200 h-4 rounded w-5/6"></div>
      <div className="bg-gray-200 h-4 rounded w-4/6"></div>
    </div>
  </div>
);

// Smart loading component with timeout and retry
export const SmartLoader = ({
  loadingPromise,
  timeout = 10000,
  retryCount = 3,
  children,
  skeleton,
  onError = () => {},
  onSuccess = () => {},
}) => {
  const [state, setState] = useState({
    loading: true,
    error: null,
    data: null,
    retryAttempt: 0,
  });

  const executeLoad = async (attempt = 0) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), timeout)
      );

      // Race between actual promise and timeout
      const data = await Promise.race([loadingPromise, timeoutPromise]);

      setState({ loading: false, error: null, data, retryAttempt: attempt });
      onSuccess(data);
    } catch (error) {
      console.error("Loading error:", error);

      if (attempt < retryCount) {
        // Exponential backoff retry
        const delay = Math.pow(2, attempt) * 1000;
        setTimeout(() => executeLoad(attempt + 1), delay);
        setState((prev) => ({ ...prev, retryAttempt: attempt + 1 }));
      } else {
        setState({ loading: false, error, data: null, retryAttempt: attempt });
        onError(error);
      }
    }
  };

  useEffect(() => {
    if (loadingPromise) {
      executeLoad();
    }
  }, [loadingPromise]);

  const retry = () => executeLoad(0);

  return (
    <ProgressiveLoader
      isLoading={state.loading}
      error={state.error}
      skeleton={skeleton}
      retryAction={retry}
      errorMessage={
        state.retryAttempt > 0
          ? `فشل التحميل بعد ${state.retryAttempt} محاولات`
          : "حدث خطأ أثناء التحميل"
      }
    >
      {children(state.data)}
    </ProgressiveLoader>
  );
};

// Lazy loading wrapper for heavy components
export const LazyWrapper = ({ children, fallback = <DefaultSkeleton /> }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [ref, setRef] = useState(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(ref);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(ref);

    return () => observer.disconnect();
  }, [ref]);

  return <div ref={setRef}>{isVisible ? children : fallback}</div>;
};

// Loading states for different scenarios
export const LoadingStates = {
  INITIAL: "initial",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
  EMPTY: "empty",
};

// Hook for managing loading states
export const useLoadingState = (initialState = LoadingStates.INITIAL) => {
  const [state, setState] = useState(initialState);
  const [error, setErrorState] = useState(null);
  const [data, setData] = useState(null);

  const setLoading = () => {
    setState(LoadingStates.LOADING);
    setErrorState(null);
  };

  const setSuccess = (data) => {
    setState(LoadingStates.SUCCESS);
    setData(data);
    setErrorState(null);
  };

  const setError = (error) => {
    setState(LoadingStates.ERROR);
    setErrorState(error);
  };

  const setEmpty = () => {
    setState(LoadingStates.EMPTY);
    setData(null);
    setErrorState(null);
  };

  return {
    state,
    error,
    data,
    isLoading: state === LoadingStates.LOADING,
    isSuccess: state === LoadingStates.SUCCESS,
    isError: state === LoadingStates.ERROR,
    isEmpty: state === LoadingStates.EMPTY,
    setLoading,
    setSuccess,
    setError,
    setEmpty,
  };
};

export default ProgressiveLoader;
