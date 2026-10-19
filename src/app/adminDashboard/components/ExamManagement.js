"use client";

import ExamsPage from "../../components/exam/ExamsPage";
import { adminAPI } from "../services/adminAPI";

// Every teacher's exams; the screen itself lives in components/exam
const loadLessons = () => adminAPI.lessons.options().then((r) => r.data || []);
const loadInstructors = () => adminAPI.users.getAllInstructors().then((r) => r.data || []);

export default function ExamManagement() {
  return <ExamsPage scope="admin" loadLessons={loadLessons} loadInstructors={loadInstructors} />;
}
