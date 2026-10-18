"use client";

import { useEffect, useState } from "react";
import { FiEye, FiLogOut } from "react-icons/fi";
import { authAPI } from "../utils/apiClient";
import { useUserData } from "../../../models/UserContext";

/** Ends "view as" and goes back to the admin dashboard as the admin. */
export async function stopViewAs() {
  try {
    await authAPI.post("/auth/view-as/stop");
  } finally {
    window.location.href = "/adminDashboard";
  }
}

const left = (expiresAt) => Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

/**
 * Red bar shown on every page while a super admin is viewing the site as another user.
 * Viewing is read only on the server; the bar makes that obvious and offers a one-click exit.
 */
export default function ViewAsBanner() {
  const { user } = useUserData();
  const viewAs = user?.viewAs;
  const [seconds, setSeconds] = useState(() => (viewAs ? left(viewAs.expiresAt) : 0));

  useEffect(() => {
    if (!viewAs) return undefined;
    const tick = () => {
      const s = left(viewAs.expiresAt);
      setSeconds(s);
      if (s <= 0) stopViewAs();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [viewAs]);

  if (!viewAs) return null;

  return (
    <div
      role="status"
      dir="rtl"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] max-w-[calc(100vw-1rem)] flex items-center gap-3 pl-1.5 pr-3 py-1.5 rounded-full bg-red-600 text-white shadow-lg text-xs"
    >
      <FiEye className="w-4 h-4 shrink-0" />
      <span className="truncate">
        تشاهد المنصة كـ <b className="font-semibold">{user.fullname || user.username}</b>
        <span className="hidden sm:inline"> · للقراءة فقط</span>
      </span>
      <span className="tabular-nums opacity-80" dir="ltr">{mmss(seconds)}</span>
      <button
        type="button"
        onClick={stopViewAs}
        className="inline-flex items-center gap-1 h-7 px-3 rounded-full bg-white text-red-700 font-semibold hover:bg-red-50 cursor-pointer"
      >
        <FiLogOut className="w-3.5 h-3.5" /> إنهاء العرض
      </button>
    </div>
  );
}
