"use client";
import { useUserData } from "../../../models/UserContext";
import PerformanceMonitor from "./PerformanceMonitor";

// Client component wrapper to access user context and pass to PerformanceMonitor
const AdminPerformanceWrapper = () => {
  const { user } = useUserData();
  return <PerformanceMonitor user={user} />;
};

export default AdminPerformanceWrapper;
