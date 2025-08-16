import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const metadata = {
  title: "لوحة تحكم المدرس - Pro Academy",
  description: "لوحة تحكم المدرس لإدارة الكورسات والدروس",
};

export default function InstructorDashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100">
      {children}
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
      />
    </div>
  );
}
