"use client";

import { useMemo, useRef, useState } from "react";
import { FiDownload, FiUpload } from "react-icons/fi";
import { Button, Dialog, textareaClass, cx } from "../ui";
import { CSV_TEMPLATE, questionsFromCsv } from "./examModel";

/** Paste or upload questions as CSV (Excel "Save as CSV UTF-8"). onAdd(editorQuestions). */
export default function CsvImportDialog({ open, onClose, onAdd }) {
  const [text, setText] = useState("");
  const file = useRef(null);
  const parsed = useMemo(() => (text.trim() ? questionsFromCsv(text) : { questions: [], errors: [] }), [text]);

  const template = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "نموذج-أسئلة.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const read = (f) => {
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result || ""));
    reader.readAsText(f, "utf-8");
  };

  const close = () => {
    setText("");
    onClose();
  };

  return (
    <Dialog
      open={open}
      wide
      closeOnBackdrop={false}
      title="استيراد أسئلة من ملف CSV"
      onClose={close}
      footer={
        <>
          <Button disabled={!parsed.questions.length} onClick={() => { onAdd(parsed.questions); close(); }}>
            إضافة {parsed.questions.length ? parsed.questions.length.toLocaleString("ar-EG") : ""} سؤال
          </Button>
          <Button variant="secondary" onClick={close}>إلغاء</Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-xs text-slate-500 leading-relaxed">
          نزّل النموذج، املأه في Excel (سؤال في كل سطر)، ثم احفظه بصيغة <b>CSV UTF-8</b> وارفعه هنا أو الصق محتواه.
          الأنواع: اختيار، متعدد، صح وخطأ، قصيرة، رقمية، مقالي. في &quot;الإجابة الصحيحة&quot; اكتب رقم الاختيار (أو أكثر مفصولة بـ ;).
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={template}><FiDownload /> تحميل النموذج</Button>
          <Button variant="secondary" size="sm" onClick={() => file.current?.click()}><FiUpload /> رفع ملف</Button>
          <input ref={file} type="file" accept=".csv,text/csv,text/plain" className="hidden" onChange={(e) => read(e.target.files?.[0])} />
        </div>
        <textarea
          dir="auto"
          className={cx(textareaClass, "min-h-40 font-mono text-xs")}
          placeholder="أو الصق محتوى الملف هنا"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {text.trim() ? (
          <div className="text-xs space-y-1">
            <p className="text-emerald-700">جاهز للإضافة: {parsed.questions.length.toLocaleString("ar-EG")} سؤال</p>
            {parsed.errors.slice(0, 8).map((e) => <p key={e} className="text-red-600">{e}</p>)}
            {parsed.errors.length > 8 ? <p className="text-red-600">و{(parsed.errors.length - 8).toLocaleString("ar-EG")} أخطاء أخرى</p> : null}
          </div>
        ) : null}
      </div>
    </Dialog>
  );
}
