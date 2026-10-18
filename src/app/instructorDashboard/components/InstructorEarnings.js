"use client";

import EarningsView from "@/app/components/EarningsView";
import { myEarningsAPI } from "@/app/services/earningsAPI";

/** The instructor's own earnings: sales, platform commission, payouts and balance due. */
export default function InstructorEarnings() {
  return (
    <div className="py-6 space-y-4">
      <div>
        <h1 className="bold-24 text-gray-900">الأرباح</h1>
        <p className="regular-14 text-gray-600">
          كل عملية بيع لدروسك وباقاتك من المحفظة أو الدفع الإلكتروني، بعد عمولة المنصة، والدفعات التي استلمتها.
        </p>
      </div>
      <EarningsView api={myEarningsAPI} />
    </div>
  );
}
