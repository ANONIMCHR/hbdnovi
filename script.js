(() => {
  "use strict";

  const config = window.BIRTHDAY_CONFIG;
  if (!config) {
    throw new Error("Konfigurasi ulang tahun tidak ditemukan. Periksa config.js.");
  }

  const introStage = document.getElementById("intro-stage");
  const memoryStage = document.getElementById("memory-stage");
  const birthdayStage = document.getElementById("birthday-stage");
  const giftButton = document.getElementById("open-gift");
  const calendarReveal = document.getElementById("calendar-reveal");
  const calendarDays = document.getElementById("calendar-days");
  const calendarMonth = document.getElementById("calendar-month");
  const calendarContinueButton = document.getElementById("continue-to-memories");
  const continueButton = document.getElementById("continue-story");
  const petalContainer = document.querySelector(".petals");
  const audio = document.getElementById("birthday-song");
  const playButton = document.getElementById("play-song");
  const playIcon = document.getElementById("play-icon");
  const progress = document.getElementById("song-progress");
  const currentTime = document.getElementById("current-time");
  const duration = document.getElementById("duration");
  const musicStatus = document.getElementById("music-status");

  const monthNames = [
    "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
    "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
  ];
  const calendarCharms = new Map([
    [1, "🌸"],
    [7, "✨"],
    [14, "💖"],
    [15, "🎀"],
    [21, "💕"],
    [28, "🧸"]
  ]);

  let introTimer;
  let memoryTimer;
  let activeTransition = false;
  let typingFrame;
  let hasTypedMessage = false;
  let seeking = false;

  function makeCalendar() {
    const { year, month, day } = config.birthday;
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12 ||
        !Number.isInteger(day) || day < 1 || day > new Date(year, month, 0).getDate()) {
      throw new Error("Tanggal ulang tahun di config.js tidak valid.");
    }

    calendarMonth.textContent = `${monthNames[month - 1]} ${year}`;
    const firstWeekday = (new Date(year, month - 1, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month, 0).getDate();
    calendarDays.replaceChildren();

    for (let index = 0; index < firstWeekday; index += 1) {
      const blank = document.createElement("span");
      blank.className = "calendar-day is-empty";
      blank.setAttribute("aria-hidden", "true");
      calendarDays.append(blank);
    }

    for (let date = 1; date <= daysInMonth; date += 1) {
      const cell = document.createElement("span");
      cell.className = date === day ? "calendar-day is-birthday" : "calendar-day";
      cell.style.setProperty("--day-index", String(date - 1));
      const isWeekend = (firstWeekday + date - 1) % 7 >= 5;
      if (isWeekend) cell.classList.add("is-weekend");
      cell.append(document.createTextNode(String(date)));
      const charm = calendarCharms.get(date);
      if (charm) {
        const sticker = document.createElement("span");
        sticker.className = "day-charm";
        sticker.setAttribute("aria-hidden", "true");
        sticker.textContent = date === day ? "🎂" : charm;
        cell.append(sticker);
      }
      if (date === day) {
        cell.setAttribute("aria-label", `${date} ${monthNames[month - 1].toLowerCase()}, hari ulang tahun`);
      }
      calendarDays.append(cell);
    }
  }

  function createPetals() {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    for (let index = 0; index < 10; index += 1) {
      const petal = document.createElement("span");
      petal.className = "petal";
      petal.style.setProperty("--left", `${Math.random() * 100}%`);
      petal.style.setProperty("--size", `${12 + Math.random() * 10}px`);
      petal.style.setProperty("--duration", `${10 + Math.random() * 9}s`);
      petal.style.setProperty("--delay", `${-Math.random() * 19}s`);
      petal.style.setProperty("--sway", `${Math.round(Math.random() * 180 - 90)}px`);
      petal.style.setProperty("--opacity", `${0.48 + Math.random() * 0.35}`);
      petal.style.setProperty("--static-top", `${Math.random() * 92}vh`);
      petalContainer.append(petal);
    }

    const blossoms = ["🌸", "🌺", "✿", "🌼"];
    for (let index = 0; index < 4; index += 1) {
      const flower = document.createElement("span");
      flower.className = "flower";
      flower.textContent = blossoms[index % blossoms.length];
      flower.style.setProperty("--left", `${Math.random() * 100}%`);
      flower.style.setProperty("--size", `${17 + Math.random() * 11}px`);
      flower.style.setProperty("--duration", `${14 + Math.random() * 10}s`);
      flower.style.setProperty("--delay", `${-Math.random() * 24}s`);
      flower.style.setProperty("--sway", `${Math.round(Math.random() * 150 - 75)}px`);
      flower.style.setProperty("--opacity", `${0.55 + Math.random() * 0.35}`);
      flower.style.setProperty("--static-top", `${Math.random() * 92}vh`);
      petalContainer.append(flower);
    }

    giftButton.addEventListener("click", () => {
      const bounds = giftButton.getBoundingClientRect();
      const burst = document.createElement("span");
      burst.className = "flower-burst";
      burst.setAttribute("aria-hidden", "true");
      burst.style.setProperty("--origin-x", `${bounds.left + bounds.width / 2}px`);
      burst.style.setProperty("--origin-y", `${bounds.top + bounds.height / 2}px`);

      for (let index = 0; index < 18; index += 1) {
        const flower = document.createElement("span");
        const angle = (Math.PI * 2 * index) / 18 + Math.random() * 0.2;
        const distance = reducedMotion ? 55 + Math.random() * 55 : 75 + Math.random() * 125;
        flower.className = "burst-flower";
        flower.textContent = blossoms[index % blossoms.length];
        flower.style.setProperty("--size", `${17 + Math.random() * 12}px`);
        flower.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
        flower.style.setProperty("--dy", `${Math.sin(angle) * distance}px`);
        flower.style.setProperty("--rotation", `${Math.round(Math.random() * 100 - 50)}deg`);
        flower.style.setProperty("--burst-delay", `${Math.random() * 100}ms`);
        burst.append(flower);
      }

      petalContainer.append(burst);
      window.setTimeout(() => burst.remove(), 1700);
    }, { once: true });
  }

  function transitionStage(outgoing, incoming, direction) {
    if (activeTransition) return 0;
    activeTransition = true;
    const leaveClass = direction === "down" ? "is-leaving-up" : "is-leaving";
    const transitionTime = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 450 : 1050;
    outgoing.classList.add("is-transition-outgoing");
    incoming.hidden = false;
    incoming.classList.add("is-transition-incoming", "is-arriving");

    requestAnimationFrame(() => {
      outgoing.classList.add(leaveClass);
      requestAnimationFrame(() => {
        incoming.classList.remove("is-arriving");
        window.setTimeout(() => {
          outgoing.hidden = true;
          outgoing.classList.remove("is-transition-outgoing", leaveClass);
          incoming.classList.remove("is-transition-incoming");
          activeTransition = false;
        }, transitionTime);
      });
    });
    return transitionTime;
  }

  function showMemoryStage() {
    if (activeTransition) return;
    clearTimeout(introTimer);
    config.photos.forEach((photo, index) => {
      const image = memoryStage.querySelectorAll(".photo-frame img")[index];
      if (image && photo.src && image.getAttribute("src") !== photo.src) {
        image.src = photo.src;
      }
    });
    const transitionTime = transitionStage(introStage, memoryStage, "down");
    window.setTimeout(() => {
      memoryTimer = window.setTimeout(showBirthdayStage, 8500);
    }, transitionTime);
  }

  function showBirthdayStage() {
    if (activeTransition || birthdayStage.hidden === false) return;
    clearTimeout(memoryTimer);
    transitionStage(memoryStage, birthdayStage, "down");
    window.setTimeout(() => {
      startTypingMessage();
    }, 1500);
  }

  function startTypingMessage() {
    if (hasTypedMessage) return;
    hasTypedMessage = true;
    const recipient = document.getElementById("recipient-name");
    const message = document.getElementById("typed-content");
    const messageMeasure = document.getElementById("message-measure");
    const cursor = document.getElementById("typing-cursor");
    const signoff = document.getElementById("letter-signoff");
    recipient.textContent = config.recipient;
    const text = config.message;
    messageMeasure.textContent = text;
    const typedText = document.createTextNode("");
    message.insertBefore(typedText, cursor);
    const delay = Math.max(22, Number(config.typingSpeed) || 34);
    const characters = Array.from(text);
    let position = 0;
    let lastFrameTime = 0;
    let elapsed = 0;
    let nextCharacterAt = delay;

    function typeFrame(timestamp) {
      if (position >= characters.length) {
        cursor.hidden = true;
        signoff.hidden = false;
        return;
      }
      if (lastFrameTime) elapsed += Math.min(timestamp - lastFrameTime, 50);
      lastFrameTime = timestamp;

      while (position < characters.length && elapsed >= nextCharacterAt) {
        const character = characters[position];
        typedText.appendData(character);
        position += 1;
        const pause = /[.!?]/u.test(character) ? 250 : /[,;:]/u.test(character) ? 120 : 0;
        nextCharacterAt += delay + pause;
      }

      if (position >= characters.length) {
        cursor.hidden = true;
        signoff.hidden = false;
        return;
      }
      typingFrame = window.requestAnimationFrame(typeFrame);
    }

    typingFrame = window.requestAnimationFrame(typeFrame);
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const wholeSeconds = Math.floor(seconds);
    const minutes = Math.floor(wholeSeconds / 60);
    const remainder = String(wholeSeconds % 60).padStart(2, "0");
    return `${minutes}:${remainder}`;
  }

  function updateProgress() {
    const total = audio.duration;
    const current = audio.currentTime;
    currentTime.textContent = formatTime(current);
    if (Number.isFinite(total) && total > 0) {
      duration.textContent = formatTime(total);
      progress.max = String(Math.floor(total));
      if (!seeking) progress.value = String(Math.floor(current));
      const percentage = Math.min(100, (current / total) * 100);
      progress.style.setProperty("--progress", `${percentage}%`);
    }
  }

  function playConfiguredSong() {
    if (!song.audioUrl) {
      musicStatus.textContent = "Audio belum diatur.";
      return;
    }

    if (!audio.src) audio.src = song.audioUrl;
    audio.play().then(() => {
      musicStatus.textContent = "sedang diputar ♡";
    }).catch((error) => {
      console.error("Lagu tidak dapat diputar:", error);
      musicStatus.textContent = "Lagu tidak dapat diputar. Periksa URL Catbox di config.js.";
    });
  }

  giftButton.addEventListener("click", () => {
    if (giftButton.disabled) return;
    giftButton.disabled = true;
    giftButton.classList.add("is-open");
    window.setTimeout(() => {
      giftButton.hidden = true;
      calendarReveal.hidden = false;
      introStage.querySelector(".intro-copy").hidden = true;
      introStage.querySelector(".made-with").hidden = true;
      introTimer = window.setTimeout(showMemoryStage, 5600);
    }, 520);
  });

  continueButton.addEventListener("click", showBirthdayStage);
  calendarContinueButton.addEventListener("click", showMemoryStage);

  const song = config.song || {};
  document.getElementById("song-title").textContent = song.title || "Lagu untukmu";
  document.getElementById("song-artist").textContent = song.artist || "";
  if (song.coverUrl) {
    document.getElementById("album-cover").src = song.coverUrl;
  }

  if (song.audioUrl) {
    playButton.disabled = false;
    progress.disabled = false;
    musicStatus.textContent = "siap menemani hari spesialmu ♡";
  }

  playButton.addEventListener("click", () => {
    if (audio.paused) {
      playConfiguredSong();
    } else {
      audio.pause();
    }
  });

  audio.addEventListener("loadedmetadata", updateProgress);
  audio.addEventListener("timeupdate", updateProgress);
  audio.addEventListener("play", () => {
    document.body.classList.add("is-playing");
    playIcon.textContent = "Ⅱ";
    playButton.setAttribute("aria-label", "Jeda lagu");
  });
  audio.addEventListener("pause", () => {
    document.body.classList.remove("is-playing");
    playIcon.textContent = "▶";
    playButton.setAttribute("aria-label", "Putar lagu");
    if (audio.currentTime > 0 && !audio.ended) musicStatus.textContent = "dijeda";
  });
  audio.addEventListener("ended", () => {
    playIcon.textContent = "▶";
    playButton.setAttribute("aria-label", "Putar lagu");
    musicStatus.textContent = "selesai diputar ♡";
    progress.value = progress.max;
    updateProgress();
  });
  audio.addEventListener("error", () => {
    musicStatus.textContent = "Lagu gagal dimuat. Pastikan URL Catbox benar dan bisa diakses.";
    console.error("Audio gagal dimuat:", audio.currentSrc || song.audioUrl);
  });

  progress.addEventListener("input", () => {
    seeking = true;
    const targetTime = Number(progress.value);
    currentTime.textContent = formatTime(targetTime);
    const percentage = progress.max > 0 ? (targetTime / Number(progress.max)) * 100 : 0;
    progress.style.setProperty("--progress", `${percentage}%`);
  });
  progress.addEventListener("change", () => {
    if (Number.isFinite(audio.duration)) audio.currentTime = Number(progress.value);
    seeking = false;
  });

  makeCalendar();
  createPetals();
})();
