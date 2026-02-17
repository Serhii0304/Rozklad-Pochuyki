(() => {
  const classTints = [
    "#fff8df",
    "#eaf8ff",
    "#f3eeff",
    "#e9fff0",
    "#fff0f5",
    "#eef6ff",
    "#fff6e9",
    "#edf9ef",
    "#f6efff",
    "#e8fbff"
  ];

  const escapeHtml = (value) =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const normalizeKey = (value) =>
    String(value || "")
      .toLowerCase()
      .replaceAll("’", "'")
      .replace(/\s+/g, " ")
      .trim();

  const stripMeta = (value) => String(value || "").replace(/\s*\([^)]*\)\s*/g, "").trim();

  const canonicalSubject = (rawName, aliasMap = {}) => {
    const base = stripMeta(rawName);
    const key = normalizeKey(base);
    return aliasMap[key] || base;
  };

  const splitCellSubjects = (rawCell, aliasMap = {}, subjectIcons = {}) => {
    const cleaned = String(rawCell || "").trim();
    if (!cleaned) {
      return [];
    }

    return cleaned
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const canonical = canonicalSubject(part, aliasMap);
        return {
          canonical,
          label: part,
          icon: subjectIcons[canonical] || "📘"
        };
      });
  };

  const getSubjectList = (scheduleRows, splitSubjectsFn) =>
    Array.from(
      new Set(
        scheduleRows.flatMap((row) =>
          (row.classes || []).flatMap((cell) => splitSubjectsFn(cell).map((subject) => subject.canonical))
        )
      )
    ).sort((a, b) => a.localeCompare(b, "uk"));

  const classPageHref = (config, className) => {
    const basePath = config?.classPagePath || "class.html";
    const separator = String(basePath).includes("?") ? "&" : "?";
    return `${basePath}${separator}class=${encodeURIComponent(className)}`;
  };

  const resolveClassFromQuery = (config) => {
    const classes = Array.isArray(config?.classes) ? config.classes : [];
    if (!classes.length) {
      return "";
    }

    const requested = new URLSearchParams(window.location.search).get("class");
    const normalized = String(requested || "").trim();
    if (normalized && classes.includes(normalized)) {
      return normalized;
    }

    return classes[0];
  };

  const groupRowsByDay = (dayOrder, scheduleRows) => {
    const grouped = new Map(dayOrder.map((day) => [day.label, []]));
    scheduleRows.forEach((row) => {
      if (grouped.has(row.day)) {
        grouped.get(row.day).push(row);
      }
    });
    return grouped;
  };

  const getLessons = (scheduleRows) =>
    Array.from(
      new Set(
        scheduleRows
          .map((row) => Number(row.lesson))
          .filter((lesson) => Number.isFinite(lesson))
      )
    ).sort((a, b) => a - b);

  const getClassWeekMatrix = (config, className) => {
    const classes = config?.classes || [];
    const classIndex = classes.indexOf(className);
    const lessons = getLessons(config?.scheduleRows || []);
    const dayOrder = config?.dayOrder || [];

    const valueByDayLesson = new Map();
    (config?.scheduleRows || []).forEach((row) => {
      const key = `${row.day}::${row.lesson}`;
      const value = classIndex >= 0 && Array.isArray(row.classes) ? row.classes[classIndex] || "" : "";
      valueByDayLesson.set(key, value);
    });

    return lessons.map((lesson) => ({
      lesson,
      values: dayOrder.map((day) => valueByDayLesson.get(`${day.label}::${lesson}`) || "")
    }));
  };

  const getClassTintByIndex = (index) => classTints[index % classTints.length];

  window.ScheduleCore = {
    classTints,
    escapeHtml,
    normalizeKey,
    stripMeta,
    canonicalSubject,
    splitCellSubjects,
    getSubjectList,
    classPageHref,
    resolveClassFromQuery,
    groupRowsByDay,
    getLessons,
    getClassWeekMatrix,
    getClassTintByIndex
  };
})();

