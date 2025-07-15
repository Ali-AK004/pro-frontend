import React, { useState } from "react";
import {
  FaTimes,
  FaCreditCard,
  FaKey,
  FaShoppingCart,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
} from "react-icons/fa";
import { studentAPI, handleAPIError } from "../../../../../services/studentAPI";
import { toast } from "react-toastify";
import { lessonAPI } from "../services/lessonAPI";

const PaymentModal = ({ lesson, isOpen, onClose, onSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);

  const handlePayment = async () => {
    if (!paymentMethod) {
      toast.error("يرجى اختيار طريقة الدفع");
      return;
    }

    if (paymentMethod === "ACCESS_CODE" && !accessCode.trim()) {
      toast.error("يرجى إدخال كود الوصول");
      return;
    }

    setIsProcessing(true);
    setPaymentResult(null);

    try {
      let response;

      if (paymentMethod === "ACCESS_CODE") {
        // Use access code
        response = await lessonAPI.payment.grantAccess(
          lesson.id,
          accessCode.trim()
        );
      } else if (paymentMethod === "FAWRY") {
        // Pay with Fawry
        response = await lessonAPI.payment.payWithFawry(lesson.id);
      }

      setPaymentResult({
        success: true,
        message: "تم شراء الدرس بنجاح!",
        data: response.data,
      });

      toast.success("تم شراء الدرس بنجاح!");

      // Call success callback after a short delay
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);
    } catch (error) {
      console.error("Payment error:", error);
      const errorMessage = handleAPIError(error, "حدث خطأ أثناء عملية الدفع");

      setPaymentResult({
        success: false,
        message: errorMessage,
        data: null,
      });

      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setPaymentMethod("");
    setAccessCode("");
    setPaymentResult(null);
    setIsProcessing(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 bg-opacity-50 flexCenter z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-[650px] mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="bold-24 text-gray-900">شراء الدرس</h2>
          <button
            onClick={handleClose}
            className="p-1 border border-gray-900/50 hover:bg-gray-100 rounded-sm cursor-pointer transition-colors"
          >
            <FaTimes className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Lesson Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="bold-18 text-gray-900 mb-2">{lesson.name}</h3>
          <p className="regular-14 text-gray-600 mb-3">
            {lesson.description || "وصف الدرس غير متاح"}
          </p>
          <div className="flex items-center justify-between">
            <span className="bold-16 text-accent">
              السعر: {lesson.price} جنيه
            </span>
          </div>
        </div>

        {/* Payment Result */}
        {paymentResult && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              paymentResult.success
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center gap-3">
              {paymentResult.success ? (
                <FaCheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <FaExclamationTriangle className="w-6 h-6 text-red-500" />
              )}
              <div>
                <p
                  className={`bold-14 ${
                    paymentResult.success ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {paymentResult.success ? "نجح الدفع!" : "فشل الدفع"}
                </p>
                <p
                  className={`regular-12 ${
                    paymentResult.success ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {paymentResult.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Methods */}
        {!paymentResult?.success && (
          <>
            <div className="mb-6">
              <h3 className="bold-18 text-gray-900 mb-4">اختر طريقة الدفع</h3>

              <div className="space-y-3">
                {/* Access Code Option */}
                <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="ACCESS_CODE"
                    checked={paymentMethod === "ACCESS_CODE"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4 text-accent"
                  />
                  <FaKey className="w-5 h-5 text-gray-600" />
                  <div className="flex-1">
                    <p className="bold-14 text-gray-900">كود الوصول</p>
                    <p className="regular-12 text-gray-600">
                      استخدم كود الوصول للحصول على الدرس
                    </p>
                  </div>
                </label>

                {/* Fawry Option */}
                <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="FAWRY"
                    checked={paymentMethod === "FAWRY"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4 text-accent"
                  />
                  <FaCreditCard className="w-5 h-5 text-gray-600" />
                  <div className="flex-1">
                    <p className="bold-14 text-gray-900">الدفع عبر فوري</p>
                    <p className="regular-12 text-gray-600">
                      ادفع باستخدام خدمة فوري
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Access Code Input */}
            {paymentMethod === "ACCESS_CODE" && (
              <div className="mb-6">
                <label className="block bold-14 text-gray-900 mb-2">
                  كود الوصول
                </label>
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="أدخل كود الوصول"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border focus:border-[#088395] "
                />
                <p className="regular-12 text-gray-500 mt-1">
                  يمكنك الحصول على كود الوصول من المدرس أو الإدارة
                </p>
              </div>
            )}

            {/* Fawry Payment Info */}
            {paymentMethod === "FAWRY" && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FaCreditCard className="w-4 h-4 text-blue-500" />
                  <p className="bold-14 text-blue-700">الدفع عبر فوري</p>
                </div>
                <p className="regular-12 text-blue-600">
                  سيتم توجيهك لصفحة الدفع الآمنة لإتمام عملية الشراء
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 cursor-pointer bg-gray-200 text-gray-700 py-3 rounded-lg bold-16 hover:bg-gray-300 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handlePayment}
                disabled={isProcessing || !paymentMethod}
                className="flex-1 bg-accent cursor-pointer text-white py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flexCenter gap-2"
              >
                {isProcessing ? (
                  <>
                    <FaSpinner className="w-4 h-4 animate-spin" />
                    جاري المعالجة...
                  </>
                ) : (
                  <>
                    <FaShoppingCart className="w-4 h-4" />
                    شراء الدرس
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* Success Actions */}
        {paymentResult?.success && (
          <div className="text-center">
            <p className="regular-14 text-gray-600 mb-4">
              سيتم إعادة توجيهك لعرض الدرس خلال ثوانٍ...
            </p>
            <button
              onClick={() => {
                onSuccess();
                handleClose();
              }}
              className="bg-accent text-white px-6 py-2 rounded-lg bold-14 hover:bg-opacity-90 transition-colors"
            >
              عرض الدرس الآن
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
