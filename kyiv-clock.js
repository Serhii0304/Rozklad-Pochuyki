(() => {
  const CLOCK_ENDPOINTS = [
    "https://worldtimeapi.org/api/timezone/Europe/Kyiv",
    "https://timeapi.io/api/Time/current/zone?timeZone=Europe/Kyiv"
  ];

  const capitalizeFirst = (value) => {
    const text = String(value || "");
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
  };

  const parseRemoteTimeMs = (payload) => {
    if (!payload || typeof payload !== "object") {
      return Number.NaN;
    }

    if (typeof payload.unixtime === "number") {
      return payload.unixtime * 1000;
    }

    if (typeof payload.utc_datetime === "string") {
      return Date.parse(payload.utc_datetime);
    }

    if (typeof payload.datetime === "string") {
      return Date.parse(payload.datetime);
    }

    if (typeof payload.dateTime === "string") {
      const raw = payload.dateTime.trim();
      if (/([zZ]|[+-]\d{2}:\d{2})$/.test(raw)) {
        return Date.parse(raw);
      }

      const offsetCandidate =
        (typeof payload.currentUtcOffset === "string" && payload.currentUtcOffset) ||
        (payload.currentUtcOffset && typeof payload.currentUtcOffset.offset === "string"
          ? payload.currentUtcOffset.offset
          : "") ||
        (typeof payload.utcOffset === "string" ? payload.utcOffset : "");

      if (/^[+-]\d{2}:\d{2}$/.test(offsetCandidate)) {
        return Date.parse(`${raw}${offsetCandidate}`);
      }

      return Date.parse(raw);
    }

    return Number.NaN;
  };

  const fetchKyivNowMs = async () => {
    for (const url of CLOCK_ENDPOINTS) {
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) {
          continue;
        }

        const payload = await response.json();
        const remoteMs = parseRemoteTimeMs(payload);
        if (Number.isFinite(remoteMs)) {
          return remoteMs;
        }
      } catch {
        // try next endpoint
      }
    }

    throw new Error("Kyiv time sync failed");
  };

  const initKyivClock = () => {
    const clock = document.querySelector("[data-kyiv-clock]");
    if (!clock) {
      return;
    }

    const dateNode = clock.querySelector("[data-kyiv-date]");
    const timeNode = clock.querySelector("[data-kyiv-time]");
    const syncNode = clock.querySelector("[data-kyiv-sync]");

    if (!dateNode || !timeNode) {
      return;
    }

    const dateFormatter = new Intl.DateTimeFormat("uk-UA", {
      timeZone: "Europe/Kyiv",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    const timeFormatter = new Intl.DateTimeFormat("uk-UA", {
      timeZone: "Europe/Kyiv",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });

    let correctionMs = 0;

    const renderClock = () => {
      const now = new Date(Date.now() + correctionMs);
      dateNode.textContent = capitalizeFirst(dateFormatter.format(now));
      timeNode.textContent = timeFormatter.format(now);
    };

    const setSyncState = (synced) => {
      if (!syncNode) {
        return;
      }
      syncNode.textContent = synced
        ? "Синхронізовано з Києвом (онлайн)"
        : "Резервний режим (офлайн)";
    };

    const syncFromInternet = async () => {
      try {
        const remoteMs = await fetchKyivNowMs();
        correctionMs = remoteMs - Date.now();
        setSyncState(true);
      } catch {
        setSyncState(false);
      } finally {
        renderClock();
      }
    };

    renderClock();
    syncFromInternet();

    setInterval(renderClock, 1000);
    setInterval(syncFromInternet, 10 * 60 * 1000);
  };

  window.initKyivClock = initKyivClock;
})();
