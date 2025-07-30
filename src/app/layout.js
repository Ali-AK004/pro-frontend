import { UserProvider } from "../../models/UserContext";
import FloatingChatButton from "./components/FloatingChatButton";
import AdminPerformanceWrapper from "./components/AdminPerformanceWrapper";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";

export const metadata = {
  title: "Pro Academy - منصة التعليم الذكي",
  description:
    "منصة تعليمية متطورة تجمع بين الذكاء الاصطناعي والتعلم التفاعلي لتحقيق أفضل النتائج الأكاديمية",
  keywords: "تعليم, ذكاء اصطناعي, امتحانات, واجبات, مدرسين, طلاب",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#088395",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        {/* Preload critical resources */}
        <link rel="preconnect" href="http://localhost:8080" />
        <link rel="dns-prefetch" href="http://localhost:8080" />

        {/* Performance optimizations */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="antialiased">
        <UserProvider>
          {children}
          <FloatingChatButton />
          <AdminPerformanceWrapper />
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={true}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            toastClassName="text-sm"
            bodyClassName="text-sm"
          />
        </UserProvider>
      </body>
    </html>
  );
}
