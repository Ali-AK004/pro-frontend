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
  FaTag,
} from "react-icons/fa";
import Link from "next/link";
import { studentAPI, handleAPIError } from "../../../../../services/studentAPI";
import { commerceAPI, apiMessage } from "../../../../../services/commerceAPI";
import { toast } from "react-toastify";
import { lessonAPI } from "../services/lessonAPI";

/**
 * Purchase of a lesson or a bundle (pass `bundle` instead of `lesson`).
 * Lessons: access code (card), prepaid wallet, or online payment through Paymob.
 * Bundles: wallet or online payment. Both accept a discount coupon (not with access codes).
 * Online payments redirect to Paymob; access is granted only after Paymob confirms.
 */
const PaymentModal = ({ lesson, bundle, isOpen, onClose, onSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [walletBalance, setWalletBalance] = useState(null);
  const [couponInput, setCouponInput] = useState("");
  const [quote, setQuote] = useState(null); // { couponCode, originalPrice, discount, finalPrice }
  const [couponError, setCouponError] = useState("");
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  const isBundle = Boolean(bundle);
  const item = isBundle ? bundle : lesson;

  useEffect(() => {
    if (!isOpen) return;
    studentAPI.wallet
      .get(0)
      .then((res) => setWalletBalance(Number(res.data?.balance ?? 0)))
      .catch(() => setWalletBalance(null));
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const price = Number(item.price ?? 0);
  const toPay = quote ? Number(quote.finalPrice) : price;
  const walletEnough = walletBalance !== null && walletBalance >= toPay;
  const couponUsable = paymentMethod !== "CODE";

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    setCheckingCoupon(true);
    setCouponError("");
    try {
      const { data } = await commerceAPI.previewCoupon(
        isBundle ? { code, bundleId: bundle.id } : { code, lessonId: lesson.id }
      );
      setQuote(data);
      toast.success(`تم تطبيق الخصم: ${data.discount} جنيه`);
    } catch (e) {
      setQuote(null);
      setCouponError(apiMessage(e, "كود الخصم غير صحيح"));
    } finally {
      setCheckingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setQuote(null);
    setCouponInput("");
    setCouponError("");
  };

  const handlePayment = async () => {
    if (!paymentMethod) {
      toast.error("يرجى اختيار طريقة الدفع");
      return;
    }
    if (paymentMethod === "CODE" && !accessCode.trim()) {
      toast.error("يرجى إدخال كود الوصول");
      return;
    }
    const coupon = quote && couponUsable ? quote.couponCode : null;

    setIsProcessing(true);
    setPaymentResult(null);
    try {
      let response;
      if (isBundle) {
        response = await commerceAPI.buyBundle(bundle.id, paymentMethod, coupon);
      } else if (paymentMethod === "CODE") {
        response = await lessonAPI.payment.grantAccess(lesson.id, accessCode.trim());
      } else if (paymentMethod === "WALLET") {
        response = await lessonAPI.payment.payWithWallet(lesson.id, coupon);
      } else {
        response = await lessonAPI.payment.payOnline(lesson.id, coupon);
      }

      if (response.data?.status === "REDIRECT_TO_PAYMENT") {
        const url = response.data?.paymentUrl;
        if (url && url.startsWith("https://")) {
          window.location.assign(url);
          return;
        }
        throw new Error("تعذر فتح صفحة الدفع");
      }

      setPaymentResult({
        success: true,
        message: isBundle
          ? `تم شراء الباقة وفتح ${response.data?.lessonsGranted ?? ""} درس!`
          : "تم شراء الدرس بنجاح!",
        data: response.data,
      });
      setTimeout(() => {
        onSuccess(response.data);
        handleClose();
      }, 2000);
    } catch (error) {
      const errorMessage = error?.response
        ? apiMessage(error, "حدث خطأ أثناء عملية الدفع")
        : handleAPIError(error, "حدث خطأ أثناء عملية الدفع");
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
    removeCoupon();
    onClose();
  };

  const Option = ({ value, icon: Icon, title, subtitle, disabled }) => (
    <label
      className={`flex items-center gap-3 p-4 border rounded-lg transition-colors     ${
 disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-50"
 }${paymentMethod === value ? "border-brand-600" : "border-gray-200"}`}
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

  const lessonsTotal = isBundle ? Number(bundle.lessonsTotal ?? 0) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
      <div className="bg-white rounded-xl p-6 w-full max-w-[650px] mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-900">{isBundle ? "شراء الباقة" : "شراء الدرس"}</h2>
          <button
            onClick={handleClose}
            className="p-1 border border-gray-900/50 hover:bg-gray-100 rounded-sm cursor-pointer transition-colors"
          >
            <FaTimes className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="bold-18 text-gray-900 mb-2">{isBundle ? bundle.title : lesson.name}</h3>
          <p className="regular-14 text-gray-600 mb-3">
            {item.description || (isBundle ? `${bundle.lessons?.length || 0} درس` : "وصف الدرس غير متاح")}
          </p>
          {isBundle && bundle.lessons?.length ? (
            <ul className="regular-12 text-gray-600 mb-3 list-disc pr-5 space-y-1">
              {bundle.lessons.map((l) => (
                <li key={l.id}>{l.name}</li>
              ))}
            </ul>
          ) : null}
          <div className="flex flex-wrap items-baseline gap-3">
            {quote ? (
              <>
                <span className="regular-14 text-gray-400 line-through">{price} جنيه</span>
                <span className="bold-16 text-emerald-600">السعر بعد الخصم: {toPay} جنيه</span>
              </>
            ) : (
              <span className="bold-16 text-accent">السعر: {price} جنيه</span>
            )}
            {isBundle && lessonsTotal > price ? (
              <span className="regular-12 text-gray-500">
                بدلًا من <span className="line-through">{lessonsTotal}</span> جنيه لو اشتريت الدروس منفصلة
              </span>
            ) : null}
          </div>
        </div>

        {paymentResult && (
          <div
            className={`mb-6 p-4 rounded-lg border   ${
 paymentResult.success ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
 }`}
          >
            <div className="flex items-center gap-3">
              {paymentResult.success ? (
                <FaCheckCircle className="w-6 h-6 text-emerald-500" />
              ) : (
                <FaExclamationTriangle className="w-6 h-6 text-red-500" />
              )}
              <div>
                <p className={`bold-14 ${paymentResult.success ? "text-emerald-700" : "text-red-700"}`}>
                  {paymentResult.success ? "تم بنجاح!" : "فشل الدفع"}
                </p>
                <p className={`regular-12 ${paymentResult.success ? "text-emerald-600" : "text-red-600"}`}>
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
                {!isBundle ? (
                  <Option value="CODE" icon={FaKey} title="كود الوصول" subtitle="استخدم كارت الدرس من المدرس أو السنتر" />
                ) : null}
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
                <Link href="/wallet" className="inline-block mt-3 regular-14 text-brand-600 underline">
                  اشحن المحفظة
                </Link>
              ) : null}
            </div>

            {couponUsable && (
              <div className="mb-6">
                <label className="flex items-center gap-2 bold-14 text-gray-900 mb-2">
                  <FaTag className="w-4 h-4 text-gray-500" />
                  كود خصم (اختياري)
                </label>
                {quote ? (
                  <div className="flex items-center justify-between gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <span className="regular-14 text-emerald-700" dir="ltr">
                      {quote.couponCode} — خصم {quote.discount} جنيه
                    </span>
                    <button onClick={removeCoupon} className="regular-12 text-red-600 underline cursor-pointer">
                      إزالة
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value);
                        setCouponError("");
                      }}
                      onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                      placeholder="مثال: RAMADAN25"
                      autoComplete="off"
                      dir="ltr"
                      maxLength={32}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:border-brand-600 uppercase text-sm focus:outline-none"
                    />
                    <button
                      onClick={applyCoupon}
                      disabled={checkingCoupon || !couponInput.trim()}
                      className="px-4 py-2 bg-gray-800 text-white rounded-lg bold-14 disabled:opacity-50 cursor-pointer"
                    >
                      {checkingCoupon ? <FaSpinner className="w-4 h-4 animate-spin" /> : "تطبيق"}
                    </button>
                  </div>
                )}
                {couponError ? <p className="mt-2 regular-12 text-red-600">{couponError}</p> : null}
              </div>
            )}

            {paymentMethod === "CODE" && (
              <div className="mb-6">
                <label className="block text-xs font-medium text-slate-600 mb-1">كود الوصول</label>
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="أدخل كود الوصول"
                  autoComplete="off"
                  dir="ltr"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border focus:border-brand-600 tracking-widest uppercase text-sm focus:outline-none"
                />
              </div>
            )}

            {paymentMethod === "PAYMOB" && toPay > 0 && (
              <div className="mb-6 p-4 bg-brand-50 border border-brand-200 rounded-lg regular-12 text-brand-700">
                سيتم توجيهك لصفحة الدفع الآمنة. يتم فتح {isBundle ? "دروس الباقة" : "الدرس"} تلقائيًا بعد تأكيد الدفع.
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 cursor-pointer bg-white border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handlePayment}
                disabled={isProcessing || !paymentMethod}
                className="flex-1 bg-brand-600 cursor-pointer text-white py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flexCenter gap-2"
              >
                {isProcessing ? (
                  <>
                    <FaSpinner className="w-4 h-4 animate-spin" />
                    جاري المعالجة...
                  </>
                ) : (
                  <>
                    <FaShoppingCart className="w-4 h-4" />
                    {quote && toPay === 0
                      ? "احصل عليه مجانًا"
                      : paymentMethod === "PAYMOB"
                      ? "المتابعة للدفع"
                      : isBundle
                      ? "شراء الباقة"
                      : "شراء الدرس"}
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {paymentResult?.success && (
          <div className="text-center">
            <p className="regular-14 text-gray-600 mb-4">
              {isBundle ? "يمكنك الآن فتح أي درس من دروس الباقة." : "سيتم إعادة توجيهك لعرض الدرس خلال ثوانٍ..."}
            </p>
            <button
              onClick={() => {
                onSuccess(paymentResult.data);
                handleClose();
              }}
              className="bg-brand-600 text-white px-4 py-2 rounded-lg bold-14 hover:bg-brand-700 transition-colors"
            >
              {isBundle ? "متابعة" : "عرض الدرس الآن"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
