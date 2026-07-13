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
};

const placeData = {
  station: {
    iconImage: "assets/stickers/station-sign.png",
    x: 25,
    y: 65,
    scale: 1.34,
    label: "Arrive",
    title: "Station",
    copy: "QR posters.",
  },
  coconut: {
    iconImage: "assets/stickers/coconut.png",
    x: 39,
    y: 31,
    scale: 1.36,
    label: "Sip",
    title: "Coconut stop",
    copy: "Ticket stub reward.",
  },
  coffee: {
    icon: "☕",
    x: 41,
    y: 29,
    scale: 1.38,
    label: "Meet",
    title: "Cafe pause",
    copy: "Before show.",
  },
  theatre: {
    iconImage: "assets/stickers/theatre-ticket.png",
    x: 63,
    y: 75,
    scale: 1.3,
    label: "Watch",
    title: "Belvoir link",
    copy: "Next night.",
  },
  park: {
    icon: "🌳",
    x: 78,
    y: 61,
    scale: 1.28,
    label: "Gather",
    title: "Green space",
    copy: "Community stop.",
  },
  noodles: {
    icon: "🍜",
    x: 73,
    y: 39,
    scale: 1.32,
    label: "Eat",
    title: "Dinner stop",
    copy: "Friend route.",
  },
};

const weekData = {
  1: {
    platform: "TikTok + Instagram",
    title: "Cast intros and a vibe teaser reel",
    copy: "A Lady Bird-style mood piece introduces the world, faces, and late-'90s Cabramatta feeling.",
    goal: "Goal: turn awareness into saved posts and ticket consideration.",
  },
  2: {
    platform: "Instagram Reels + stories",
    title: "Behind-the-scenes rehearsal clips",
    copy: "Short rehearsal moments help the show feel human, current, and close to young viewers.",
    goal: "Goal: make Belvoir feel less distant before purchase.",
  },
  3: {
    platform: "TikTok + Instagram",
    title: "#CoconutChildrenBelvoir challenge goes live",
    copy: "Audience prompts invite young people to post their own coming-of-age story.",
    goal: "Goal: turn attention into participation and peer discovery.",
  },
  4: {
    platform: "All channels",
    title: "Opening night, winner announced, matinee push",
    copy: "Weekly double-pass winner, brunch-spot recommendations in bio, and a clear 1-2pm matinee callout.",
    goal: "Goal: convert social interest into group bookings and return offers.",
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
    title: "Local engagement",
    copy: "Cabramatta partnerships make the show feel connected to place, not only to the theatre building.",
  },
  offer: {
    title: "Return offer",
    copy: "A 90-day young audience offer gives people a concrete reason to come back.",
  },
  second: {
    title: "Second purchase",
    copy: "Referral codes and ticket data make repeat attendance visible and measurable.",
  },
};

const mapState = {
  selectedLocation: "coconut",
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
    document.querySelector("#ticketLabel").textContent = data.label;
    document.querySelector("#ticketOffer").textContent = data.offer;
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
