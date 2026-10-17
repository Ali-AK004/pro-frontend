"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import NavBar from "@/app/components/navBar";
import { studentAPI } from "@/app/services/studentAPI";

/**
 * Paymob sends the student back here. The query string from Paymob is NOT trusted:
 * we only read our own order id and ask the API, which is updated by the signed webhook.
 */
function PaymentResult() {
  const params = useSearchParams();
  const orderId = params.get("order");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) {
      setError("رقم العملية غير موجود");
      return;
    }
    let attempts = 0;
    let timer;
    const poll = async () => {
      try {
        const { data } = await studentAPI.payments.getOrder(orderId);
        setOrder(data);
        if (data.status === "PENDING" && attempts++ < 20) {
          timer = setTimeout(poll, 3000);
        }
      } catch {
        setError("تعذر التحقق من عملية الدفع");
      }
    };
    poll();
    return () => clearTimeout(timer);
  }, [orderId]);

  const status = order?.status;
  return (
    <div className="max-w-lg mx-auto bg-white rounded-xl shadow-sm p-8 text-center space-y-4">
      {error ? <p className="text-red-600 bold-16">{error}</p> : null}
      {!error && (!order || status === "PENDING") ? (
        <>
          <p className="bold-18">جاري تأكيد الدفع...</p>
          <p className="regular-14 text-gray-500">
            لو دفعت بكود فوري، سيتم فتح الدرس تلقائيًا بعد السداد في أي فرع أو تطبيق.
          </p>
        </>
      ) : null}
      {status === "PAID" ? (
        <>
          <p className="bold-20 text-green-600">تم الدفع بنجاح</p>
          <p className="regular-14 text-gray-600">
            {order.purpose === "WALLET_TOPUP" ? "تم شحن محفظتك." : `تم فتح الدرس: ${order.lessonName || ""}`}
          </p>
        </>
      ) : null}
      {status === "FAILED" || status === "EXPIRED" ? (
        <p className="bold-18 text-red-600">لم تتم عملية الدفع. لم يتم خصم أي مبلغ منك.</p>
      ) : null}
      <div className="flex gap-3 justify-center pt-2">
        <Link href="/profile" className="bg-accent text-white px-5 py-2 rounded-lg">
          دروسي
        </Link>
        <Link href="/wallet" className="bg-gray-200 px-5 py-2 rounded-lg">
          المحفظة
        </Link>
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <div className="min-h-screen bg-main" dir="rtl">
      <NavBar />
      <div className="padding-container py-12">
        <Suspense fallback={null}>
          <PaymentResult />
        </Suspense>
      </div>
    </div>
  );
}
