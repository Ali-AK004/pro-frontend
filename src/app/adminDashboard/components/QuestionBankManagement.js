"use client";

import QuestionBankPage from "../../components/exam/QuestionBankPage";
import { adminAPI } from "../services/adminAPI";

const loadInstructors = () => adminAPI.users.getAllInstructors().then((r) => r.data || []);

export default function QuestionBankManagement() {
  return <QuestionBankPage scope="admin" loadInstructors={loadInstructors} />;
}
