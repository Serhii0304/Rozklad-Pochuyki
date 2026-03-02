(() => {
  const TARGET_TIME = { hour: 9, minute: 0 };
  const TIME_ZONE = "Europe/Kyiv";
  const STORAGE_PLAYED_DATE_KEY = "minuteOfSilence.playedDateKyiv";
  const STORAGE_LOCK_KEY = "minuteOfSilence.playLock";
  const LOCK_TTL_MS = 15000;
  const TAB_ID = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const scriptUrl = document.currentScript?.src || window.location.href;
  const audioSrc = new URL("./Хвилина мовчання.mp3", scriptUrl).href;

  const kyivFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  let audio = null;
  let isPlayInProgress = false;
  let pendingUserGestureDate = "";
  let hasGestureListeners = false;
  let memoryPlayedDate = "";
  let retryHandlerRef = null;

  const safeStorageGet = (key) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  };

  const safeStorageSet = (key, value) => {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  };

  const safeStorageRemove = (key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  };

  const parseLock = (raw) => {
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  };

  const getKyivNow = () => {
    const now = new Date();
    const parts = kyivFormatter.formatToParts(now);
    const map = Object.create(null);

    parts.forEach((part) => {
      if (part.type !== "literal") {
        map[part.type] = part.value;
      }
    });

    const year = Number(map.year || "0");
    const month = Number(map.month || "0");
    const day = Number(map.day || "0");
    const hour = Number(map.hour || "0");
    const minute = Number(map.minute || "0");
    const second = Number(map.second || "0");

    return {
      dateKey: `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      hour,
      minute,
      second,
      nowMs: now.getTime()
    };
  };

  const getPlayedDate = () => safeStorageGet(STORAGE_PLAYED_DATE_KEY) || memoryPlayedDate;

  const setPlayedDate = (dateKey) => {
    memoryPlayedDate = dateKey;
    safeStorageSet(STORAGE_PLAYED_DATE_KEY, dateKey);
  };

  const hasPlayedForDate = (dateKey) => getPlayedDate() === dateKey;

  const shouldTriggerNow = (hour, minute) => hour === TARGET_TIME.hour && minute === TARGET_TIME.minute;

  const isTargetAlreadyReached = (hour, minute) =>
    hour > TARGET_TIME.hour || (hour === TARGET_TIME.hour && minute >= TARGET_TIME.minute);

  const acquirePlayLock = (dateKey) => {
    const nowMs = Date.now();
    const currentLock = parseLock(safeStorageGet(STORAGE_LOCK_KEY));

    if (
      currentLock &&
      currentLock.dateKey === dateKey &&
      currentLock.owner !== TAB_ID &&
      nowMs - Number(currentLock.createdAt || 0) < LOCK_TTL_MS
    ) {
      return false;
    }

    const nextLock = {
      owner: TAB_ID,
      dateKey,
      createdAt: nowMs
    };

    if (!safeStorageSet(STORAGE_LOCK_KEY, JSON.stringify(nextLock))) {
      return true;
    }

    const confirmed = parseLock(safeStorageGet(STORAGE_LOCK_KEY));
    return Boolean(confirmed && confirmed.owner === TAB_ID && confirmed.dateKey === dateKey);
  };

  const releasePlayLock = () => {
    const currentLock = parseLock(safeStorageGet(STORAGE_LOCK_KEY));
    if (!currentLock || currentLock.owner === TAB_ID) {
      safeStorageRemove(STORAGE_LOCK_KEY);
    }
  };

  const ensureAudio = () => {
    if (audio) {
      return audio;
    }
    const nextAudio = new Audio(audioSrc);
    nextAudio.preload = "auto";
    nextAudio.loop = false;
    audio = nextAudio;
    return audio;
  };

  const removeGestureListeners = () => {
    if (!hasGestureListeners) {
      return;
    }
    if (retryHandlerRef) {
      ["pointerdown", "mousedown", "touchstart", "keydown"].forEach((eventName) => {
        window.removeEventListener(eventName, retryHandlerRef, true);
      });
    }
    retryHandlerRef = null;
    hasGestureListeners = false;
  };

  const attachGestureListeners = () => {
    if (hasGestureListeners) {
      return;
    }

    const retryHandler = () => {
      if (!pendingUserGestureDate) {
        return;
      }
      void attemptPlayback(true);
    };

    retryHandlerRef = retryHandler;
    ["pointerdown", "mousedown", "touchstart", "keydown"].forEach((eventName) => {
      window.addEventListener(eventName, retryHandler, true);
    });
    hasGestureListeners = true;
  };

  const attemptPlayback = async (fromUserGesture = false) => {
    const now = getKyivNow();
    const { dateKey, hour, minute } = now;

    if (hasPlayedForDate(dateKey) || isPlayInProgress) {
      return;
    }

    if (pendingUserGestureDate && pendingUserGestureDate !== dateKey) {
      pendingUserGestureDate = "";
      removeGestureListeners();
    }

    if (fromUserGesture) {
      if (!pendingUserGestureDate || pendingUserGestureDate !== dateKey || !isTargetAlreadyReached(hour, minute)) {
        return;
      }
    } else {
      if (!shouldTriggerNow(hour, minute)) {
        return;
      }
      if (pendingUserGestureDate === dateKey) {
        return;
      }
    }

    if (!acquirePlayLock(dateKey)) {
      return;
    }

    const minuteAudio = ensureAudio();
    minuteAudio.currentTime = 0;
    isPlayInProgress = true;

    try {
      await minuteAudio.play();
      setPlayedDate(dateKey);
      pendingUserGestureDate = "";
      removeGestureListeners();
      isPlayInProgress = false;
    } catch {
      pendingUserGestureDate = dateKey;
      attachGestureListeners();
      isPlayInProgress = false;
      releasePlayLock();
      return;
    }

    releasePlayLock();
  };

  // Returns ms from now until today's TARGET_TIME (9:00:00.000) in Kyiv.
  // Negative means the target has already passed today.
  const getMsUntilTodayTarget = () => {
    const { hour, minute, second, nowMs } = getKyivNow();
    const currentSecondOfDay = hour * 3600 + minute * 60 + second;
    const targetSecondOfDay = TARGET_TIME.hour * 3600 + TARGET_TIME.minute * 60;
    const secondsDiff = targetSecondOfDay - currentSecondOfDay;
    // Subtract sub-second offset so setTimeout fires at the exact second boundary
    return secondsDiff * 1000 - (nowMs % 1000);
  };

  // Returns ms from now until Kyiv midnight (start of the next calendar day).
  const getMsUntilMidnightKyiv = () => {
    const { hour, minute, second, nowMs } = getKyivNow();
    const elapsedMs = (hour * 3600 + minute * 60 + second) * 1000 + (nowMs % 1000);
    return 24 * 3600 * 1000 - elapsedMs;
  };

  // Schedules a single precise setTimeout for today's 9:00:00.
  // Does nothing if 9:00 has already passed today or was already played.
  const scheduleForToday = () => {
    const now = getKyivNow();

    if (hasPlayedForDate(now.dateKey)) {
      return;
    }

    const msUntilTarget = getMsUntilTodayTarget();

    // If 9:00 has already passed today — do not schedule, audio will not play.
    if (msUntilTarget <= 0) {
      return;
    }

    setTimeout(() => {
      void attemptPlayback(false);
    }, msUntilTarget);
  };

  // After each Kyiv midnight, reschedule for the new day.
  const scheduleNextDay = () => {
    const msUntilMidnight = getMsUntilMidnightKyiv();
    setTimeout(() => {
      scheduleForToday();
      scheduleNextDay();
    }, msUntilMidnight + 1000); // 1-second buffer past midnight
  };

  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_PLAYED_DATE_KEY && typeof event.newValue === "string" && event.newValue) {
      memoryPlayedDate = event.newValue;
    }
  });

  scheduleForToday();
  scheduleNextDay();
})();
