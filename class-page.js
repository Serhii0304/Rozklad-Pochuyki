(() => {
  if (typeof window.initKyivClock === "function") {
    window.initKyivClock();
  }

  const table = document.querySelector("table");
  if (!table) {
    return;
  }

  const tableScrollContainer = table.closest("[data-table-scroll]") || table.parentElement;
  if (tableScrollContainer) {
    tableScrollContainer.addEventListener(
      "wheel",
      (event) => {
        const canScrollX = tableScrollContainer.scrollWidth > tableScrollContainer.clientWidth + 1;
        if (!canScrollX) {
          return;
        }

        const horizontalGesture = event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) * 1.25;
        if (!horizontalGesture) {
          return;
        }

        const delta = event.deltaX || event.deltaY;
        if (!delta) {
          return;
        }

        const previousLeft = tableScrollContainer.scrollLeft;
        tableScrollContainer.scrollLeft += delta;
        if (tableScrollContainer.scrollLeft !== previousLeft) {
          event.preventDefault();
        }
      },
      { passive: false }
    );
  }

  const normalizeSubject = (value) =>
    value
      .toLowerCase()
      .replace(/\([^)]*\)/g, " ")
      .replace(/[.,]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const splitSubjects = (value) =>
    value
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((label) => ({
        label,
        canonical: normalizeSubject(label)
      }))
      .filter((item) => Boolean(item.canonical));

  const needsWrap = (label) => String(label || "").trim().length > 24;

  const subjectCells = Array.from(table.querySelectorAll("tbody td")).filter((cell) =>
    Boolean(cell.querySelector(".subject-name"))
  );

  subjectCells.forEach((cell) => {
    const subjectElement = cell.querySelector(".subject-name");
    if (!subjectElement) {
      return;
    }

    const groupInfoNodes = Array.from(cell.querySelectorAll(".group-info"));
    const groupSuffix = groupInfoNodes
      .map((node) => (node.textContent || "").trim())
      .filter(Boolean)
      .join(" ");
    const sourceLabel = `${subjectElement.textContent || ""} ${groupSuffix}`.trim();
    const subjects = splitSubjects(sourceLabel);
    if (!subjects.length) {
      return;
    }

    const stack = document.createElement("div");
    stack.className = "subject-stack";

    subjects.forEach((subject, index) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = needsWrap(subject.label) ? "subject-chip subject-chip--wrap" : "subject-chip";
      chip.dataset.subject = subject.canonical;
      chip.textContent = subject.label;
      stack.append(chip);

      if (index < subjects.length - 1) {
        const divider = document.createElement("span");
        divider.className = "divider";
        divider.textContent = "/";
        stack.append(divider);
      }
    });

    subjectElement.replaceWith(stack);
    groupInfoNodes.forEach((node) => node.remove());
  });

  let activeSubjectKey = "";

  const clearSubjectHighlight = () => {
    table.querySelectorAll("td.linked-cell").forEach((cell) => {
      cell.classList.remove("linked-cell");
    });
    table.querySelectorAll(".subject-chip.is-linked").forEach((chip) => {
      chip.classList.remove("is-linked");
    });
    activeSubjectKey = "";
  };

  const applySubjectHighlight = (subjectKey) => {
    clearSubjectHighlight();
    if (!subjectKey) {
      return;
    }

    activeSubjectKey = subjectKey;
    subjectCells.forEach((cell) => {
      const chips = Array.from(cell.querySelectorAll(".subject-chip"));
      const hasMatch = chips.some((chip) => chip.dataset.subject === subjectKey);
      cell.classList.toggle("linked-cell", hasMatch);
      chips.forEach((chip) => {
        chip.classList.toggle("is-linked", chip.dataset.subject === subjectKey);
      });
    });
  };

  table.addEventListener("click", (event) => {
    const chip = event.target.closest(".subject-chip");
    if (!chip || !table.contains(chip)) {
      return;
    }

    const subject = chip.dataset.subject || "";
    if (activeSubjectKey === subject) {
      clearSubjectHighlight();
      return;
    }

    applySubjectHighlight(subject);
  });

  const activeConfig = window.ActiveSchoolScheduleConfig || window.SchoolScheduleConfig || window.SchoolScheduleConfigJunior;
  const backTarget = activeConfig?.homePagePath || "index.html";

  document.getElementById("backButton")?.addEventListener("click", () => {
    window.location.replace(backTarget);
  });

  const rows = table.querySelectorAll("tbody tr");
  rows.forEach((row, index) => {
    row.animate(
      [
        { opacity: 0, transform: "translateY(12px)" },
        { opacity: 1, transform: "translateY(0)" }
      ],
      {
        duration: 380,
        delay: 140 + index * 80,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "forwards"
      }
    );
  });

  let printCleanup = null;

  const preparePrintView = () => {
    if (printCleanup) {
      return;
    }

    const restoreActions = [];

    table.querySelectorAll(".subject-chip").forEach((chip) => {
      const plainChip = document.createElement("span");
      plainChip.className = chip.className;
      plainChip.textContent = chip.textContent || "";
      chip.replaceWith(plainChip);
      restoreActions.push(() => {
        plainChip.replaceWith(chip);
      });
    });

    rows.forEach((row) => {
      row.getAnimations().forEach((anim) => anim.cancel());
      row.style.opacity = "1";
      row.style.transform = "none";
    });

    printCleanup = () => {
      for (let index = restoreActions.length - 1; index >= 0; index -= 1) {
        restoreActions[index]();
      }
      rows.forEach((row) => {
        row.style.removeProperty("opacity");
        row.style.removeProperty("transform");
      });
    };
  };

  const restoreAfterPrint = () => {
    if (!printCleanup) {
      return;
    }

    const cleanup = printCleanup;
    printCleanup = null;
    cleanup();
  };

  document.getElementById("printButton")?.addEventListener("click", () => {
    preparePrintView();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
      });
    });
  });

  window.addEventListener("beforeprint", preparePrintView);
  window.addEventListener("afterprint", restoreAfterPrint);
})();



