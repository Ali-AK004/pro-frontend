import React, { useEffect, useState } from "react";
import {
  FaTimes,
  FaCreditCard,
  FaKey,
  FaWallet,
  FaShoppingCart,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
} from "react-icons/fa";
import Link from "next/link";
import { studentAPI, handleAPIError } from "../../../../../services/studentAPI";
import { toast } from "react-toastify";
import { lessonAPI } from "../services/lessonAPI";

/**
 * Lesson purchase: access code (card), prepaid wallet, or online payment through Paymob
 * (bank cards, Vodafone Cash and other mobile wallets, Fawry reference code).
 * Online payments redirect to Paymob; access is granted only after Paymob confirms.
 */
const PaymentModal = ({ lesson, isOpen, onClose, onSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [walletBalance, setWalletBalance] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    studentAPI.wallet
      .get(0)
      .then((res) => setWalletBalance(Number(res.data?.balance ?? 0)))
      .catch(() => setWalletBalance(null));
  }, [isOpen]);

  const price = Number(lesson?.price ?? 0);
  const walletEnough = walletBalance !== null && walletBalance >= price;

  const handlePayment = async () => {
    if (!paymentMethod) {
      toast.error("يرجى اختيار طريقة الدفع");
      return;
    }
    if (paymentMethod === "CODE" && !accessCode.trim()) {
      toast.error("يرجى إدخال كود الوصول");
      return;
    }

    setIsProcessing(true);
    setPaymentResult(null);
    try {
      let response;
      if (paymentMethod === "CODE") {
        response = await lessonAPI.payment.grantAccess(lesson.id, accessCode.trim());
      } else if (paymentMethod === "WALLET") {
        response = await lessonAPI.payment.payWithWallet(lesson.id);
      } else if (paymentMethod === "PAYMOB") {
        response = await lessonAPI.payment.payOnline(lesson.id);
        const url = response.data?.paymentUrl;
        if (url && url.startsWith("https://")) {
          window.location.assign(url);
          return;
        }
        throw new Error("تعذر فتح صفحة الدفع");
      }

      setPaymentResult({ success: true, message: "تم شراء الدرس بنجاح!", data: response.data });
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);
    } catch (error) {
      const errorMessage = handleAPIError(error, "حدث خطأ أثناء عملية الدفع");
      setPaymentResult({ success: false, message: errorMessage, data: null });
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

  const Option = ({ value, icon: Icon, title, subtitle, disabled }) => (
    <label
      className={`flex items-center gap-3 p-4 border rounded-lg transition-colors ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-50"
      } ${paymentMethod === value ? "border-[#088395]" : "border-gray-200"}`}
    >
      <input
        type="radio"
        name="paymentMethod"
        value={value}
        disabled={disabled}
        checked={paymentMethod === value}
        onChange={(e) => setPaymentMethod(e.target.value)}
        className="w-4 h-4 text-accent"
      />
      <Icon className="w-5 h-5 text-gray-600" />
      <div className="flex-1">
        <p className="bold-14 text-gray-900">{title}</p>
        <p className="regular-12 text-gray-600">{subtitle}</p>
      </div>
    </label>
  );

  return (
    <div className="fixed inset-0 bg-black/20 bg-opacity-50 flexCenter z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-[650px] mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="bold-24 text-gray-900">شراء الدرس</h2>
          <button
            onClick={handleClose}
            className="p-1 border border-gray-900/50 hover:bg-gray-100 rounded-sm cursor-pointer transition-colors"
          >
            <FaTimes className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="bold-18 text-gray-900 mb-2">{lesson.name}</h3>
          <p className="regular-14 text-gray-600 mb-3">{lesson.description || "وصف الدرس غير متاح"}</p>
          <span className="bold-16 text-accent">السعر: {lesson.price} جنيه</span>
        </div>

        {paymentResult && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              paymentResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center gap-3">
              {paymentResult.success ? (
                <FaCheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <FaExclamationTriangle className="w-6 h-6 text-red-500" />
              )}
              <div>
                <p className={`bold-14 ${paymentResult.success ? "text-green-700" : "text-red-700"}`}>
                  {paymentResult.success ? "تم بنجاح!" : "فشل الدفع"}
                </p>
                <p className={`regular-12 ${paymentResult.success ? "text-green-600" : "text-red-600"}`}>
                  {paymentResult.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {!paymentResult?.success && (
          <>
            <div className="mb-6">
              <h3 className="bold-18 text-gray-900 mb-4">اختر طريقة الدفع</h3>
              <div className="space-y-3">
                <Option value="CODE" icon={FaKey} title="كود الوصول" subtitle="استخدم كارت الدرس من المدرس أو السنتر" />
                <Option
                  value="WALLET"
                  icon={FaWallet}
                  title="المحفظة"
                  disabled={walletBalance !== null && !walletEnough}
                  subtitle={
                    walletBalance === null
                      ? "ادفع من رصيد محفظتك"
                      : `رصيدك: ${walletBalance} جنيه${walletEnough ? "" : " — الرصيد لا يكفي"}`
                  }
                />
                <Option
                  value="PAYMOB"
                  icon={FaCreditCard}
                  title="الدفع الإلكتروني"
                  subtitle="فيزا / ميزة / فودافون كاش ومحافظ الموبايل / كود فوري"
                />
              </div>
              {walletBalance !== null && !walletEnough ? (
                <Link href="/wallet" className="inline-block mt-3 regular-14 text-[#088395] underline">
                  اشحن المحفظة
                </Link>
              ) : null}
            </div>

            {paymentMethod === "CODE" && (
              <div className="mb-6">
                <label className="block bold-14 text-gray-900 mb-2">كود الوصول</label>
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="أدخل كود الوصول"
                  autoComplete="off"
                  dir="ltr"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border focus:border-[#088395] tracking-widest uppercase"
                />
              </div>
            )}

            {paymentMethod === "PAYMOB" && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg regular-12 text-blue-700">
                سيتم توجيهك لصفحة الدفع الآمنة. يتم فتح الدرس تلقائيًا بعد تأكيد الدفع.
              </div>
            )}

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
                    {paymentMethod === "PAYMOB" ? "المتابعة للدفع" : "شراء الدرس"}
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {paymentResult?.success && (
          <div className="text-center">
            <p className="regular-14 text-gray-600 mb-4">سيتم إعادة توجيهك لعرض الدرس خلال ثوانٍ...</p>
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
