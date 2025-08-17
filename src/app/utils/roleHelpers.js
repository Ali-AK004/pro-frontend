// Get the appropriate instructor ID based on user role
export const getInstructorId = (user) => {
  if (!user) return null;

  switch (user.role) {
    case "INSTRUCTOR":
      return user.id;
    case "ASSISTANT":
      return user.instructorId;
    default:
      return null;
  }
};

// Check if user can access instructor dashboard
export const canAccessInstructorDashboard = (user) => {
  return user && ["INSTRUCTOR", "ASSISTANT"].includes(user.role);
};

// Get role-specific permissions
export const getRolePermissions = (role) => {
  const permissions = {
    INSTRUCTOR: {
      canCreateCourse: true,
      canDeleteCourse: true,
      canEditCourse: true,
      canCreateLesson: true,
      canDeleteLesson: true,
      canEditLesson: true,
      canCreateExam: true,
      canDeleteExam: true,
      canEditExam: true,
      canCreateAssignment: true,
      canDeleteAssignment: true,
      canEditAssignment: true,
      canViewAnalytics: true,
      canManageStudents: true,
    },
    ASSISTANT: {
      canCreateCourse: true,
      canDeleteCourse: true,
      canEditCourse: true,
      canCreateLesson: true,
      canDeleteLesson: true,
      canEditLesson: true,
      canCreateExam: true,
      canDeleteExam: true,
      canEditExam: true,
      canCreateAssignment: true,
      canDeleteAssignment: true,
      canEditAssignment: true,
      canViewAnalytics: true,
      canManageStudents: false,
    },
  };

  return permissions[role] || {};
};
