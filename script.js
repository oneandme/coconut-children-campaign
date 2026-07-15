const pages = [...document.querySelectorAll(".scene")];
const navKeys = [...document.querySelectorAll(".nav-key")];

const ticketData = {
  solo: {
    label: "First-time young audience ticket",
    offer: "A low-pressure entry point for someone new to Belvoir.",
  },
  friend: {
    label: "2-person tickets",
    offer: "Save when you book together and make the night social from the start.",
  },
  family: {
    label: "Family pricing",
    offer: "Make the story shareable across generations and households.",
  },
  drink: {
    label: "HEYTEA Perk",
    offer: "Ticket stub = coconut drink discount. The ticket becomes a social reward before the show.",
  },
};

const placeData = {
  station: {
    iconImage: "assets/map-markers/cabramatta-station.png",
    x: 33,
    y: 63,
    scale: 1.34,
    label: "Arrive",
    title: "Cabramatta Station",
    copy: "QR flyers turn commuter foot traffic into campaign-site visits.",
  },
  heyytea: {
    iconImage: "assets/map-markers/heyytea-coconut-boba.png",
    x: 47,
    y: 38,
    scale: 1.36,
    label: "Sip",
    title: "HEYTEA",
    copy: "Ticket stub or QR code unlocks a coconut drink discount.",
  },
  library: {
    iconImage: "assets/stickers/library-book.png",
    x: 58,
    y: 52,
    scale: 1.3,
    label: "Discover",
    title: "Cabramatta Library",
    copy: "A Coconut Children pop-up display connects the story to local memory.",
  },
  school: {
    iconImage: "assets/map-markers/cabramatta-high-school.png",
    x: 70,
    y: 66,
    scale: 1.28,
    label: "Discuss",
    title: "Cabramatta High School",
    copy: "Student group tickets pair with a coming-of-age discussion prompt.",
  },
  wsu: {
    iconImage: "assets/map-markers/wsu-parramatta.png",
    x: 77,
    y: 34,
    scale: 1.32,
    label: "Share",
    title: "WSU Parramatta",
    copy: "Campus ambassadors and short-video creators extend the route to Western Sydney students.",
  },
};

const weekData = {
  1: {
    platform: "Cabramatta Station",
    title: "Station QR flyers",
    copy: "QR flyers catch commuting students and friend groups at the first point of the route.",
    goal: "Goal: turn everyday foot traffic into campaign-site visits.",
  },
  2: {
    platform: "Cabramatta Library",
    title: "Library pop-up",
    copy: "A small display and cast Q&A introduce late-'90s Cabramatta, migration, friendship, and local memory.",
    goal: "Goal: make the story feel rooted in the community before purchase.",
  },
  3: {
    platform: "HEYTEA",
    title: "HEYTEA ticket perk",
    copy: "Ticket holders use a stub or QR code for a coconut drink discount before or after the show.",
    goal: "Goal: turn a ticket into a visible social reward.",
  },
  4: {
    platform: "WSU Parramatta + Belvoir",
    title: "Creator posts + friend-ticket push",
    copy: "Campus ambassadors post short videos, then viewers receive a friend-ticket or second-night offer.",
    goal: "Goal: convert social sharing into return attendance.",
  },
};

const pathData = {
  first: {
    title: "First ticket",
    copy: "Coconut Children becomes a clear entry point for first-time 18-24 audiences.",
  },
  friend: {
    title: "Friend experience",
    copy: "Two-person tickets and group prompts reduce the social barrier to trying theatre.",
  },
  local: {
    title: "Cabramatta route",
    copy: "Station, HEYTEA, Library, High School, and WSU turn the campaign into a local youth pathway.",
  },
  offer: {
    title: "Friend-ticket offer",
    copy: "After the show, ticket holders receive a friend-ticket or second-night offer to bring someone back.",
  },
  second: {
    title: "Second purchase",
    copy: "Referral codes and ticket data make repeat attendance visible and measurable.",
  },
};

const mapState = {
  selectedLocation: "heyytea",
  panX: 0,
  panY: 0,
  scale: 1.2,
  dragging: false,
  dragStartX: 0,
  dragStartY: 0,
  dragPanX: 0,
  dragPanY: 0,
};

function clamp(value, min, max) {
  if (min > max) return (min + max) / 2;
  return Math.min(Math.max(value, min), max);
}

function applyMapTransform() {
  const canvas = document.querySelector("#cabramattaMapCanvas");
  if (!canvas) return;
  canvas.style.setProperty("--pan-x", `${mapState.panX}px`);
  canvas.style.setProperty("--pan-y", `${mapState.panY}px`);
  canvas.style.setProperty("--map-scale", mapState.scale);
}

function renderMiniMonth(referenceDate = new Date()) {
  const monthLabel = document.querySelector("#calendarMonthLabel");
  const miniMonth = document.querySelector("#miniMonthCalendar");
  if (!monthLabel || !miniMonth) return;

  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const todayDate = referenceDate.getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const previousMonthDays = new Date(year, month, 0).getDate();
  const visibleDays = Math.max(21, Math.ceil((firstDay + daysInMonth) / 7) * 7);
  const monthName = referenceDate.toLocaleString("en-US", { month: "long" });

  monthLabel.textContent = `${monthName} ${year}`;
  miniMonth.setAttribute("aria-label", `${monthName} ${year} mini month calendar`);

  miniMonth.querySelectorAll("small").forEach((day) => day.remove());

  for (let index = 0; index < visibleDays; index += 1) {
    const dayCell = document.createElement("small");
    const dayNumber = index - firstDay + 1;

    if (dayNumber < 1) {
      dayCell.textContent = previousMonthDays + dayNumber;
      dayCell.className = "outside-month";
    } else if (dayNumber > daysInMonth) {
      dayCell.textContent = dayNumber - daysInMonth;
      dayCell.className = "outside-month";
    } else {
      dayCell.textContent = dayNumber;
      if (dayNumber === todayDate) {
        dayCell.className = "today";
        dayCell.setAttribute("aria-current", "date");
      }
    }

    miniMonth.append(dayCell);
  }
}

function centerMapOnLocation(placeId, options = {}) {
  const viewport = document.querySelector("#cabramattaMapViewport");
  const canvas = document.querySelector("#cabramattaMapCanvas");
  const data = placeData[placeId];
  if (!viewport || !canvas || !data) return;

  mapState.scale = data.scale || 1.2;
  const viewportRect = viewport.getBoundingClientRect();
  const canvasWidth = canvas.offsetWidth;
  const canvasHeight = canvas.offsetHeight;
  const markerX = (data.x / 100) * canvasWidth * mapState.scale;
  const markerY = (data.y / 100) * canvasHeight * mapState.scale;

  const minX = viewportRect.width - canvasWidth * mapState.scale - 28;
  const maxX = 28;
  const minY = viewportRect.height - canvasHeight * mapState.scale - 28;
  const maxY = 28;

  mapState.panX = clamp(viewportRect.width / 2 - markerX, minX, maxX);
  mapState.panY = clamp(viewportRect.height / 2 - markerY, minY, maxY);

  if (options.instant) {
    canvas.classList.add("dragging");
    applyMapTransform();
    requestAnimationFrame(() => canvas.classList.remove("dragging"));
    return;
  }

  applyMapTransform();
}

function updatePlace(placeId, options = {}) {
  document.querySelectorAll("[data-place]").forEach((button) => {
    button.classList.toggle("active", button.dataset.place === placeId);
  });
  const data = placeData[placeId];
  if (!data) return;
  mapState.selectedLocation = placeId;
  window.selectedLocation = placeId;
  document.querySelector("#placeLabel").textContent = data.label;
  document.querySelector("#placeTitle").textContent = data.title;
  document.querySelector("#placeCopy").textContent = data.copy;

  if (!options.skipCenter) {
    centerMapOnLocation(placeId, options);
  }
}

function renderIllustratedMap() {
  const canvas = document.querySelector("#cabramattaMapCanvas");
  const controls = document.querySelector("#cabramattaPlaceButtons");
  if (!canvas || !controls) return;

  Object.entries(placeData).forEach(([id, place]) => {
    const marker = document.createElement("button");
    marker.className = "map-icon";
    marker.type = "button";
    marker.dataset.place = id;
    marker.style.setProperty("--x", `${place.x}%`);
    marker.style.setProperty("--y", `${place.y}%`);
    marker.setAttribute("aria-label", place.title);
    if (place.iconImage) {
      const image = document.createElement("img");
      image.src = place.iconImage;
      image.alt = "";
      marker.append(image);
    } else {
      marker.textContent = place.icon;
    }
    canvas.append(marker);

    const chip = document.createElement("button");
    chip.className = "place-chip";
    chip.type = "button";
    chip.dataset.place = id;
    chip.setAttribute("aria-label", place.title);
    chip.title = place.title;
    if (place.iconImage) {
      const image = document.createElement("img");
      image.src = place.iconImage;
      image.alt = "";
      chip.append(image);
    } else {
      chip.textContent = place.icon;
    }
    controls.append(chip);
  });

  requestAnimationFrame(() => updatePlace(mapState.selectedLocation, { instant: true }));
}

function initMapDrag() {
  const viewport = document.querySelector("#cabramattaMapViewport");
  const canvas = document.querySelector("#cabramattaMapCanvas");
  if (!viewport || !canvas) return;

  viewport.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    mapState.dragging = true;
    mapState.dragStartX = event.clientX;
    mapState.dragStartY = event.clientY;
    mapState.dragPanX = mapState.panX;
    mapState.dragPanY = mapState.panY;
    viewport.classList.add("dragging");
    canvas.classList.add("dragging");
    viewport.setPointerCapture(event.pointerId);
  });

  viewport.addEventListener("pointermove", (event) => {
    if (!mapState.dragging) return;
    const viewportRect = viewport.getBoundingClientRect();
    const minX = viewportRect.width - canvas.offsetWidth * mapState.scale - 28;
    const minY = viewportRect.height - canvas.offsetHeight * mapState.scale - 28;
    mapState.panX = clamp(mapState.dragPanX + event.clientX - mapState.dragStartX, minX, 28);
    mapState.panY = clamp(mapState.dragPanY + event.clientY - mapState.dragStartY, minY, 28);
    applyMapTransform();
  });

  const stopDrag = (event) => {
    if (!mapState.dragging) return;
    mapState.dragging = false;
    viewport.classList.remove("dragging");
    canvas.classList.remove("dragging");
    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }
  };

  viewport.addEventListener("pointerup", stopDrag);
  viewport.addEventListener("pointercancel", stopDrag);
  window.addEventListener("resize", () => {
    centerMapOnLocation(mapState.selectedLocation, { instant: true });
  });
}

function showPage(pageId) {
  pages.forEach((page) => page.classList.toggle("active", page.id === pageId));
  navKeys.forEach((key) => key.classList.toggle("active", key.dataset.page === pageId));
  history.replaceState(null, "", `#${pageId}`);
  if (pageId === "cabramatta") {
    requestAnimationFrame(() => centerMapOnLocation(mapState.selectedLocation, { instant: true }));
  }
}

document.addEventListener("click", (event) => {
  const navToggle = event.target.closest(".nav-toggle");
  if (navToggle) {
    const isSmallDesktop = window.matchMedia("(max-width: 1180px)").matches;
    if (isSmallDesktop) {
      document.body.classList.toggle("nav-expanded");
      const expanded = document.body.classList.contains("nav-expanded");
      navToggle.setAttribute("aria-expanded", String(expanded));
    } else {
      document.body.classList.toggle("nav-collapsed");
      const expanded = !document.body.classList.contains("nav-collapsed");
      navToggle.setAttribute("aria-expanded", String(expanded));
    }
    return;
  }

  const jump = event.target.closest("[data-jump]");
  if (jump) {
    showPage(jump.dataset.jump);
    return;
  }

  const nav = event.target.closest(".nav-key");
  if (nav) {
    showPage(nav.dataset.page);
    return;
  }

  const ticket = event.target.closest("[data-ticket]");
  if (ticket) {
    document.querySelectorAll("[data-ticket]").forEach((button) => {
      button.classList.toggle("active", button === ticket);
    });
    const data = ticketData[ticket.dataset.ticket];
    const ticketLabel = document.querySelector("#ticketLabel");
    const ticketOffer = document.querySelector("#ticketOffer");
    if (ticketLabel && ticketOffer && data) {
      ticketLabel.textContent = data.label;
      ticketOffer.textContent = data.offer;
    }
    return;
  }

  const prompt = event.target.closest("[data-prompt]");
  if (prompt) {
    const title = prompt.dataset.prompt;
    document.querySelector("#postTitle").textContent = title;
    document.querySelector("#postCopy").textContent =
      "Use this prompt as a short video, caption, or photo story, then tag #CoconutChildrenBelvoir.";
    return;
  }

  const place = event.target.closest("[data-place]");
  if (place) {
    updatePlace(place.dataset.place);
    return;
  }

  const creator = event.target.closest("[data-creator]");
  if (creator) {
    document.querySelectorAll("[data-creator]").forEach((card) => {
      card.classList.toggle("active", card === creator);
    });
    return;
  }

  const week = event.target.closest("[data-week]");
  if (week) {
    document.querySelectorAll("[data-week]").forEach((button) => {
      button.classList.toggle("active", button === week);
    });
    const data = weekData[week.dataset.week];
    document.querySelector("#weekPlatform").textContent = data.platform;
    document.querySelector("#weekTitle").textContent = data.title;
    document.querySelector("#weekCopy").textContent = data.copy;
    document.querySelector("#weekGoal").textContent = data.goal;
    return;
  }

  const pathNode = event.target.closest("[data-path]");
  if (pathNode) {
    document.querySelectorAll("[data-path]").forEach((button) => {
      button.classList.toggle("active", button === pathNode);
    });
    const data = pathData[pathNode.dataset.path];
    document.querySelector("#pathTitle").textContent = data.title;
    document.querySelector("#pathCopy").textContent = data.copy;
  }
});

const initialPage = window.location.hash.replace("#", "");
if (pages.some((page) => page.id === initialPage)) {
  showPage(initialPage);
}

renderIllustratedMap();
initMapDrag();
renderMiniMonth();
