"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import NavBar from "@/app/components/navBar";
import { studentAPI, handleAPIError } from "@/app/services/studentAPI";

const TYPE_LABELS = {
  CHARGE_CODE: "شحن بكارت",
  ONLINE_TOPUP: "شحن إلكتروني",
  LESSON_PURCHASE: "شراء درس",
  BUNDLE_PURCHASE: "شراء باقة",
  REFUND: "استرداد",
  ADMIN_ADJUSTMENT: "تعديل من الإدارة",
};

export default function WalletPage() {
  const [wallet, setWallet] = useState(null);
  const [code, setCode] = useState("");
  const [amount, setAmount] = useState("100");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await studentAPI.wallet.get(0);
      setWallet(data);
    } catch (e) {
      toast.error(handleAPIError(e, "تعذر تحميل المحفظة"));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const redeem = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    try {
      const { data } = await studentAPI.wallet.redeem(code.trim());
      setWallet(data);
      setCode("");
      toast.success("تم شحن المحفظة");
    } catch (err) {
      toast.error(handleAPIError(err, "كود الشحن غير صحيح"));
    } finally {
      setBusy(false);
    }
  };

  const topup = async (e) => {
    e.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 10) {
      toast.error("أقل مبلغ للشحن 10 جنيه");
      return;
    }
    setBusy(true);
    try {
      const { data } = await studentAPI.wallet.topup(value);
      if (data?.checkoutUrl?.startsWith("https://")) {
        window.location.assign(data.checkoutUrl);
        return;
      }
      throw new Error("تعذر فتح صفحة الدفع");
    } catch (err) {
      toast.error(handleAPIError(err, "تعذر بدء الدفع"));
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-main" dir="rtl">
      <NavBar />
      <div className="max-container padding-container py-10 space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="regular-14 text-gray-500">رصيد المحفظة</p>
          <p className="bold-32 text-gray-900">{wallet ? `${wallet.balance} جنيه` : "..."}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <form onSubmit={redeem} className="bg-white rounded-xl shadow-sm p-6 space-y-3">
            <h2 className="bold-18">شحن بكارت</h2>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="اكتب كود الكارت"
              dir="ltr"
              autoComplete="off"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg tracking-widest uppercase"
            />
            <button disabled={busy} className="w-full bg-accent text-white py-3 rounded-lg bold-16 disabled:opacity-50">
              شحن
            </button>
          </form>

          <form onSubmit={topup} className="bg-white rounded-xl shadow-sm p-6 space-y-3">
            <h2 className="bold-18">شحن إلكتروني</h2>
            <input
              type="number"
              min="10"
              max="10000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            />
            <p className="regular-12 text-gray-500">فيزا / ميزة / فودافون كاش / كود فوري</p>
            <button disabled={busy} className="w-full bg-accent text-white py-3 rounded-lg bold-16 disabled:opacity-50">
              المتابعة للدفع
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="bold-18 mb-4">آخر العمليات</h2>
          {!wallet?.transactions?.length ? (
            <p className="regular-14 text-gray-500">لا توجد عمليات بعد</p>
          ) : (
            <ul className="divide-y">
              {wallet.transactions.map((t) => (
                <li key={t.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="bold-14">{TYPE_LABELS[t.type] || t.type}</p>
                    <p className="regular-12 text-gray-500">
                      {t.lessonName || t.note || ""} — {new Date(t.createdAt).toLocaleString("ar-EG")}
                    </p>
                  </div>
                  <span className={`bold-16 ${Number(t.amount) < 0 ? "text-red-600" : "text-emerald-600"}`} dir="ltr">
                    {Number(t.amount) > 0 ? "+" : ""}
                    {t.amount}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
