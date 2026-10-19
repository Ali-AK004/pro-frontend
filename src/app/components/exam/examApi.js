"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { apiConfig } from "../../../config/api";
import { attachAuthRefresh } from "../../utils/authRefresh";

/** Exam engine endpoints (staff, students, question bank, images). Auth is the HttpOnly cookie. */
const client = attachAuthRefresh(
  axios.create({
    baseURL: apiConfig.baseURL,
    withCredentials: true,
    timeout: apiConfig.timeout || 30000,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
  })
);

export const apiError = (error, fallback = "حدث خطأ غير متوقع") => {
  const data = error?.response?.data;
  if (data?.message) return data.message;
  if (data?.errorMessage) return data.errorMessage;
  if (error?.code === "ECONNABORTED" || !error?.response) return "تعذر الاتصال بالخادم، تحقق من الإنترنت";
  return fallback;
};

export const examApi = {
  // ---------------------------------------------------------------- staff
  /** Admin: every exam. params: { instructorId, courseId, lessonId, q, page, size } */
  listAll: (params) => client.get("/exams", { params }),
  /** Teacher or assistant: one teacher's exams. */
  listForInstructor: (instructorId, params) => client.get(`/exams/instructors/${instructorId}`, { params }),
  manage: (examId) => client.get(`/exams/${examId}/manage`),
  create: (lessonId, body) => client.post(`/exams/lessons/${lessonId}`, body),
  update: (examId, body) => client.put(`/exams/${examId}`, body),
  remove: (examId) => client.delete(`/exams/${examId}`),
  copy: (examId, lessonId) => client.post(`/exams/${examId}/copy`, null, { params: { lessonId } }),

  submissions: (examId, params) => client.get(`/exams/${examId}/submissions`, { params }),
  submission: (submissionId) => client.get(`/exams/submissions/${submissionId}`),
  grade: (submissionId, body) => client.put(`/exams/submissions/${submissionId}/grade`, body),
  regrade: (examId) => client.post(`/exams/${examId}/regrade`),
  analytics: (examId) => client.get(`/exams/${examId}/analytics`),
  exportCsv: (examId) => client.get(`/exams/${examId}/export`, { responseType: "blob" }),
  overrides: (examId) => client.get(`/exams/${examId}/overrides`),
  saveOverride: (examId, body) => client.put(`/exams/${examId}/overrides`, body),
  deleteOverride: (examId, studentId) => client.delete(`/exams/${examId}/overrides/${studentId}`),

  uploadImage: (file) => {
    const form = new FormData();
    form.append("file", file);
    return client.post("/exams/media", form, { headers: { "Content-Type": "multipart/form-data" } });
  },

  // ---------------------------------------------------------------- students
  me: (examId) => client.get(`/exams/${examId}/me`),
  start: (examId) => client.post(`/exams/${examId}/start`),
  save: (attemptId, body) => client.put(`/exams/attempts/${attemptId}/answers`, body, { timeout: 15000 }),
  event: (attemptId, type) => client.post(`/exams/attempts/${attemptId}/events`, { type }, { timeout: 10000 }),
  submit: (attemptId, body) => client.post(`/exams/attempts/${attemptId}/submit`, body),
};

export const bankApi = {
  /** params: { ownerId, q, type, difficulty, tag, page, size } */
  list: (params) => client.get("/question-bank", { params }),
  create: (items, ownerId) => client.post("/question-bank", items, { params: ownerId ? { ownerId } : undefined }),
  update: (id, item) => client.put(`/question-bank/${id}`, item),
  remove: (id) => client.delete(`/question-bank/${id}`),
  used: (ids) => client.post("/question-bank/used", ids),
};

// ---------------------------------------------------------------- images

const imageCache = new Map();

/**
 * Object URL of a question image. Loaded through the API client (cookies + token refresh),
 * so it works across origins and after the access token expires.
 */
export function useExamImage(id) {
  const [url, setUrl] = useState(() => (id ? imageCache.get(id) || null : null));
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    setFailed(false);
    if (!id) {
      setUrl(null);
      return undefined;
    }
    if (imageCache.has(id)) {
      setUrl(imageCache.get(id));
      return undefined;
    }
    client
      .get(`/exams/media/${id}`, { responseType: "blob" })
      .then(({ data }) => {
        const objectUrl = URL.createObjectURL(data);
        imageCache.set(id, objectUrl);
        if (alive) setUrl(objectUrl);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [id]);
  return { url, failed };
}

/** Saves a blob response as a file. */
export function downloadBlob(response, fallbackName) {
  const disposition = response.headers?.["content-disposition"] || "";
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  const name = match ? decodeURIComponent(match[1]) : fallbackName;
  const url = URL.createObjectURL(response.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
