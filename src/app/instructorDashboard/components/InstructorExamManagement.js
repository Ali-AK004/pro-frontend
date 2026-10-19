"use client";

import { useCallback } from "react";
import { useUserData } from "../../../../models/UserContext";
import { instructorAPI } from "../services/instructorAPI";
import { fetchAllPages } from "../../utils/pageList";
import ExamsPage from "../../components/exam/ExamsPage";

// The teacher's exams (assistants see their teacher's); the screen lives in components/exam
export default function InstructorExamManagement() {
  const { user } = useUserData();
  const instructorId = user?.instructorId || user?.id;
  const loadLessons = useCallback(
    () => (instructorId ? fetchAllPages((params) => instructorAPI.lessons.list(instructorId, params)) : Promise.resolve([])),
    [instructorId]
  );
  return <ExamsPage scope="instructor" instructorId={instructorId} loadLessons={loadLessons} />;
}
