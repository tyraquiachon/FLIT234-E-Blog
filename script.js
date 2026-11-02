// entries on the line — flip open to true when an entry is published
const entries = [
  { num: "01", ko: "목적지", en: "Target Country", icon: "🧳", page: "entry1.html", thumb: "images/entry1-seoul.jpg", open: true },
  { num: "02", ko: "여행 준비", en: "Pre-Traveling", icon: "✈️", page: "entry2.html", thumb: "images/entry2-cover.jpg", open: true },
  { num: "03", ko: "문화 이해", en: "Cross-Cultural Understanding", icon: "🌏", page: "entry3.html", thumb: "images/entry3-cover.jpg", open: true },
  { num: "04", ko: "범죄와 정의", en: "Crime & Amanda Knox", icon: "⚖️", page: "entry4.html", thumb: "images/entry4-cover.jpg", open: true },
  { num: "05", ko: "언어와 영화", en: "Language & Film", icon: "🎬", page: "entry5.html", thumb: "images/entry5-cover.jpg", open: true },
  { num: "06", ko: "음식과 식사 예절", en: "Food & Table Manners", icon: "🍜", page: "entry6.html", thumb: "images/entry6-cover.jpg", open: true },
  { num: "07", ko: "건강", en: "Health", icon: "🩺", page: "entry7.html", thumb: "images/entry7-cover.jpg", open: true }
];

// hangul hover headings
document.querySelectorAll(".hangul-flip").forEach((el) => {
  el.dataset.en = el.textContent;

  const swap = (toKo) => {
    if (el.classList.contains("is-ko") === toKo) return;
    el.classList.add("fading");
    setTimeout(() => {
      el.textContent = toKo ? el.dataset.ko : el.dataset.en;
      el.classList.toggle("is-ko", toKo);
      el.classList.remove("fading");
    }, 180);
  };

  el.addEventListener("mouseenter", () => swap(true));
  el.addEventListener("mouseleave", () => swap(false));
  // + phones have no hover, so tapping toggles instead
  el.addEventListener("touchstart", () => swap(!el.classList.contains("is-ko")), { passive: true });
});

// home page route map
const stationList = document.getElementById("stations");

if (stationList) {
  const board = document.getElementById("boardText");
  const openCount = entries.filter((e) => e.open).length;
  const latest = entries[openCount - 1];

  entries.forEach((entry) => {
    const li = document.createElement("li");
    const station = document.createElement(entry.open ? "a" : "button");
    station.className = "station" + (entry.open ? "" : " locked");
    if (entry.open) station.href = entry.page;

    station.innerHTML = `
      <span class="dot">${entry.num}</span>
      <div class="station-card">
        <div class="station-thumb">${entry.icon}</div>
        <div class="station-body">
          <span class="station-ko">${entry.ko}</span>
          <span class="station-en">${entry.en}</span>
          <span class="status">${entry.open ? "Now boarding" : "Coming soon"}</span>
        </div>
      </div>`;

    // + only use the photo as the thumbnail if it actually exists
    if (entry.open) {
      const img = new Image();
      img.onload = () => {
        const thumb = station.querySelector(".station-thumb");
        thumb.style.backgroundImage = `url(${entry.thumb})`;
        thumb.textContent = "";
      };
      img.src = entry.thumb;
    }

    station.addEventListener("mouseenter", () => {
      board.textContent = entry.open
        ? `${entry.num} ${entry.ko} · ${entry.en}`
        : `${entry.num} 공사중 · Under construction`;
    });
    station.addEventListener("mouseleave", () => {
      board.textContent = `다음 역 · Next stop: ${latest.ko} ${latest.en}`;
    });

    if (!entry.open) {
      station.addEventListener("click", () => {
        station.classList.remove("shake");
        void station.offsetWidth;
        station.classList.add("shake");
        board.textContent = `${entry.num} 아직 열리지 않았습니다 · Not open yet`;
      });
    }

    li.appendChild(station);
    stationList.appendChild(li);
  });

  board.textContent = `다음 역 · Next stop: ${latest.ko} ${latest.en}`;

  // + locked part of the track covers every segment past the latest open station
  const lockedPct = ((entries.length - openCount) / (entries.length - 1)) * 100;
  document.querySelector(".track-locked").style.setProperty("--locked-pct", lockedPct + "%");

  // + layout adapts to however many stations are in the list
  document.getElementById("metro").style.setProperty("--stations", entries.length);

  // + train pulls into the latest open station (each station sits in the middle of its column)
  const train = document.querySelector(".train");
  train.style.left = "1%";
  requestAnimationFrame(() => {
    setTimeout(() => {
      train.style.left = ((openCount - 0.5) / entries.length) * 100 + "%";
    }, 300);
  });
}

// entry page photo slots
document.querySelectorAll(".photo").forEach((fig) => {
  const img = fig.querySelector("img");
  fig.dataset.file = img.getAttribute("src");
  img.addEventListener("error", () => fig.classList.add("empty"));
  if (img.complete && img.naturalWidth === 0) fig.classList.add("empty");
});

// section chips highlight while scrolling
const chips = document.querySelectorAll(".chips a");

if (chips.length) {
  const observer = new IntersectionObserver((items) => {
    items.forEach((item) => {
      if (!item.isIntersecting) return;
      chips.forEach((c) => c.classList.toggle("active", c.getAttribute("href") === "#" + item.target.id));
    });
  }, { rootMargin: "-40% 0px -55% 0px" });

  document.querySelectorAll(".entry section[id]").forEach((s) => observer.observe(s));
}

// map of korea
const mapEl = document.getElementById("map");

if (mapEl && window.L) {
  const map = L.map("map", { scrollWheelZoom: false }).setView([36.3, 127.8], 7);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  const pinStyle = { radius: 9, color: "#007a38", weight: 4, fillColor: "#fff", fillOpacity: 1 };

  // + entry pages with an itinerary set window.tripDays before this script loads
  if (window.tripDays) {
    const tabs = document.getElementById("dayTabs");
    const list = document.getElementById("dayStops");
    const title = document.getElementById("dayTitle");
    const allStops = tripDays.flatMap((d) => d.stops);

    L.polyline(allStops.map((s) => s.at), { color: "#00a84d", weight: 4, dashArray: "8 8" }).addTo(map);
    allStops.forEach((s) => L.circleMarker(s.at, pinStyle).addTo(map).bindPopup(`<strong>${s.name}</strong><br>${s.note}`));

    const showDay = (i) => {
      const day = tripDays[i];
      tabs.querySelectorAll("button").forEach((b, j) => b.classList.toggle("active", i === j));
      title.textContent = day.title;
      list.innerHTML = day.stops.map((s, j) => `
        <li><span class="n">${j + 1}</span><div><strong>${s.name}</strong><span>${s.note}</span></div></li>`).join("");
      map.flyToBounds(L.latLngBounds(day.stops.map((s) => s.at)).pad(0.4), { maxZoom: 13, duration: 1 });
    };

    tripDays.forEach((day, i) => {
      const btn = document.createElement("button");
      btn.textContent = day.label;
      btn.addEventListener("click", () => showDay(i));
      tabs.appendChild(btn);
    });

    showDay(0);
  } else {
    const pins = [
      { name: "Seoul 서울", note: "capital city on the Han River", at: [37.5665, 126.978] },
      { name: "Panmunjom / DMZ 판문점", note: "border with North Korea", at: [37.9559, 126.6773] },
      { name: "Busan 부산", note: "second-largest city and main port", at: [35.1796, 129.0756] },
      { name: "Gyeongju 경주", note: "capital of the Silla kingdom", at: [35.8562, 129.2247] },
      { name: "Jeju Island 제주도", note: "volcanic island, home of Hallasan", at: [33.3617, 126.5292] }
    ];

    pins.forEach((p) => {
      L.circleMarker(p.at, pinStyle)
        .addTo(map)
        .bindPopup(`<strong>${p.name}</strong><br>${p.note}`);
    });
  }
}

// next-station link on entry pages only works once that entry is open
document.querySelectorAll(".platform .next[data-next]").forEach((link) => {
  const entry = entries[Number(link.dataset.next) - 1];
  if (!entry.open) {
    link.classList.add("locked-link");
    link.removeAttribute("href");
  }
});

// packing checklist
const checklist = document.querySelector(".checklist");

if (checklist) {
  const boxes = checklist.querySelectorAll("input[type=checkbox]");
  const bar = checklist.querySelector(".progress-bar");
  const count = checklist.querySelector(".count");

  const update = () => {
    const done = [...boxes].filter((b) => b.checked).length;
    bar.style.width = (done / boxes.length) * 100 + "%";
    count.textContent = `${done} / ${boxes.length} packed`;
  };

  boxes.forEach((b) => b.addEventListener("change", update));
  update();
}

// korean phrase audio
document.querySelectorAll(".speak").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (!("speechSynthesis" in window)) return;
    const say = new SpeechSynthesisUtterance(btn.dataset.say);
    say.lang = "ko-KR";
    say.rate = 0.85;
    speechSynthesis.cancel();
    speechSynthesis.speak(say);
  });
});

// expectation vs reality cards
document.querySelectorAll(".flip").forEach((card) => {
  card.addEventListener("click", () => card.classList.toggle("flipped"));
});