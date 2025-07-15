# صفحة عرض الدرس - Lesson Display Page

تم إنشاء صفحة عرض الدرس بنجاح وربطها بصفحة الكورس في المسار:
`src/app/instructors/[instructorId]/courses/[courseId]/lessons/[lessonId]/page.js`

## التحديثات المنجزة ✅

### 1. إنشاء صفحة الدرس الجديدة

- صفحة كاملة مع نظام تبويبات متقدم
- دعم عرض الامتحان والفيديو والواجب
- التحكم في الوصول بناءً على التقدم

### 2. ربط صفحة الكورس بصفحة الدرس

- تم تعديل `handleViewLesson` في صفحة الكورس
- الآن عند الضغط على "عرض الدرس" ينتقل الطالب للصفحة الجديدة
- تم إزالة `LessonViewer` القديم

### 3. تحديث مكون LessonCard

- تم تبسيط استدعاء `onViewLesson`
- إزالة المعاملات غير المستخدمة

## مسار التنقل 🔄

```
صفحة المدرسين → صفحة المدرس → صفحة الكورس → صفحة الدرس
     ↓              ↓              ↓              ↓
/instructors → /instructors/[id] → /courses/[id] → /lessons/[id]
```

### خطوات التنقل:

1. **صفحة المدرسين**: `/instructors`
2. **صفحة المدرس**: `/instructors/[instructorId]`
3. **صفحة الكورس**: `/instructors/[instructorId]/courses/[courseId]`
4. **صفحة الدرس**: `/instructors/[instructorId]/courses/[courseId]/lessons/[lessonId]` ← **الجديد**

### التفاعل:

- في صفحة الكورس: الضغط على "عرض الدرس" ← ينتقل للصفحة الجديدة
- في صفحة الدرس: زر "العودة" ← يعود لصفحة الكورس

## الميزات الرئيسية

### 1. عرض معلومات الدرس

- اسم الدرس ووصفه
- صورة الدرس
- السعر وحالة الوصول
- معلومات المدرس
- تاريخ انتهاء الوصول

### 2. نظام التبويبات (Tabs)

- **نظرة عامة**: معلومات شاملة عن الدرس
- **الامتحان**: عرض وحل الامتحان
- **الفيديو**: مشاهدة الفيديو التعليمي
- **الواجب**: عرض وتسليم الواجب

### 3. التحكم في الوصول

- التحكم في الوصول بناءً على حالة الشراء
- التحكم في الوصول للامتحان والفيديو والواجب
- عرض رسائل الخطأ المناسبة

### 4. تتبع التقدم

- عرض حالة التقدم الحالية
- تحديث التقدم تلقائياً بعد إكمال كل مرحلة

## هيكل البيانات المطلوبة

```json
{
  "lesson": {
    "id": "string",
    "courseId": "string",
    "name": "string",
    "description": "string",
    "photoUrl": "string",
    "price": "number",
    "instructorId": "string",
    "instructorName": "string",
    "accessExpiryDate": "string",
    "expired": "boolean"
  },
  "exam": {
    "id": "string",
    "lessonId": "string",
    "title": "string",
    "passingScore": "number",
    "questions": [
      {
        "id": "string",
        "questionText": "string",
        "questionType": "SINGLE_CHOICE|MULTIPLE_CHOICE|TRUE_FALSE",
        "points": "number",
        "answers": [
          {
            "id": "string",
            "answerText": "string",
            "correct": "boolean"
          }
        ]
      }
    ]
  },
  "assignment": {
    "id": "string",
    "lessonId": "string",
    "title": "string",
    "description": "string",
    "dueDate": "string",
    "maxPoints": "number",
    "submissionText": "string",
    "submissionDate": "string",
    "grade": "number",
    "feedback": "string"
  },
  "hasAccess": "boolean",
  "videoUrl": "string",
  "accessError": "string",
  "progressStatus": "PURCHASED|EXAM_PASSED|VIDEO_WATCHED|ASSIGNMENT_DONE",
  "canAccessVideo": "boolean",
  "canAccessExam": "boolean",
  "canAccessAssignment": "boolean"
}
```

## API Endpoint

```
GET http://localhost:8080/api/students/lessons/{lessonId}
```

## المكونات المستخدمة

### 1. TabButton

مكون لعرض أزرار التبويبات مع التحكم في الوصول

### 2. OverviewTab

عرض نظرة عامة على الدرس ومعلوماته

### 3. ExamTab

عرض الامتحان وإمكانية حله مع:

- عرض الأسئلة بأنواعها المختلفة
- التحقق من الإجابات
- عرض النتائج

### 4. VideoTab

عرض الفيديو التعليمي مع:

- مشغل فيديو متقدم
- تتبع المشاهدة
- تسجيل إكمال المشاهدة

### 5. AssignmentTab

عرض الواجب مع:

- وصف الواجب
- تاريخ التسليم
- إمكانية كتابة وتسليم الإجابة
- عرض الدرجة والتعليقات

## حالات التقدم

1. **PURCHASED**: تم شراء الدرس
2. **EXAM_PASSED**: تم اجتياز الامتحان
3. **VIDEO_WATCHED**: تم مشاهدة الفيديو
4. **ASSIGNMENT_DONE**: تم إنجاز الواجب

## الاستخدام

1. انتقل إلى المسار: `/instructors/[instructorId]/courses/[courseId]/lessons/[lessonId]`
2. سيتم جلب بيانات الدرس تلقائياً من API
3. سيتم عرض التبويب المناسب بناءً على حالة التقدم
4. يمكن التنقل بين التبويبات حسب الصلاحيات

## اختبار الصفحة

يمكن اختبار الصفحة باستخدام:

- الملف التجريبي: `src/app/test-lesson-page.js`
- البيانات التجريبية المرفقة
- API endpoint المحدد

## الملاحظات

- تم استخدام نفس أنماط التصميم المستخدمة في المشروع
- تم دعم اللغة العربية بالكامل
- تم إضافة معالجة شاملة للأخطاء
- تم تحسين تجربة المستخدم مع حالات التحميل والأخطاء
