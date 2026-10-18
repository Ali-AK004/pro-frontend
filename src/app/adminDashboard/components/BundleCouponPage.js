"use client";

import { useEffect, useState } from "react";
import BundleCouponManager from "@/app/components/BundleCouponManager";
import { adminAPI } from "../services/adminAPI";

/** Admin view: bundles and coupons of every instructor, plus platform-wide coupons. */
export default function BundleCouponPage() {
  const [instructors, setInstructors] = useState([]);
  useEffect(() => {
    adminAPI.users
      .getAllInstructors()
      .then((res) => {
        const d = res.data;
        setInstructors(Array.isArray(d) ? d : d?.content || d?.data || []);
      })
      .catch(() => setInstructors([]));
  }, []);
  return <BundleCouponManager role="ADMIN" instructors={instructors} />;
}
