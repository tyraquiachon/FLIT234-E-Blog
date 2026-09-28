// entries on the line — flip open to true when an entry is published
const entries = [
  { num: "01", ko: "목적지", en: "Target Country", icon: "🧳", page: "entry1.html", thumb: "images/entry1-seoul.jpg", open: true },
  { num: "02", ko: "여행 준비", en: "Pre-Traveling", icon: "✈️", page: "entry2.html", thumb: "images/entry2-cover.jpg", open: false },
  { num: "03", ko: "문화 이해", en: "Cross-Cultural Understanding", icon: "🌏", page: "entry3.html", thumb: "images/entry3-cover.jpg", open: false },
  { num: "04", ko: "범죄와 정의", en: "Crime & Amanda Knox", icon: "⚖️", page: "entry4.html", thumb: "images/entry4-cover.jpg", open: false }
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

  // + train pulls into the latest open station (stations sit at 12.5%, 37.5%, 62.5%, 87.5%)
  const train = document.querySelector(".train");
  train.style.left = "2%";
  requestAnimationFrame(() => {
    setTimeout(() => {
      train.style.left = 12.5 + (openCount - 1) * 25 + "%";
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

  const pins = [
    { name: "Seoul 서울", note: "capital city on the Han River", at: [37.5665, 126.978] },
    { name: "Panmunjom / DMZ 판문점", note: "border with North Korea", at: [37.9559, 126.6773] },
    { name: "Busan 부산", note: "second-largest city and main port", at: [35.1796, 129.0756] },
    { name: "Gyeongju 경주", note: "capital of the Silla kingdom", at: [35.8562, 129.2247] },
    { name: "Jeju Island 제주도", note: "volcanic island, home of Hallasan", at: [33.3617, 126.5292] }
  ];

  pins.forEach((p) => {
    L.circleMarker(p.at, { radius: 9, color: "#007a38", weight: 4, fillColor: "#fff", fillOpacity: 1 })
      .addTo(map)
      .bindPopup(`<strong>${p.name}</strong><br>${p.note}`);
  });
}
