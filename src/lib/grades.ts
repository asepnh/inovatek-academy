// Grade / level options shown in the student enrollment dropdown.
// Edit this list to match Inovatek Academy's actual class levels.
export const GRADE_OPTIONS = [
  "Preschool",
  "Primary 1",
  "Primary 2",
  "Primary 3",
  "Primary 4",
  "Primary 5",
  "Primary 6",
  "Secondary 1",
  "Secondary 2",
  "Secondary 3",
  "Secondary 4",
  "Secondary 5",
  "Other",
] as const;

// Broad level options shown in the class "grade level" dropdown (which age
// band a class targets — classes don't need per-grade precision like
// students do). "All levels" is offered separately as the default in the
// class forms themselves.
export const CLASS_GRADE_LEVELS = ["Primary", "Secondary"] as const;
