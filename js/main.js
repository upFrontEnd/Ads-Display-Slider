// js/main.js

export const Ads2026 = {
  timeline: gsap.timeline({}),
  introTimeline: gsap.timeline({}),
  outroTimeline: gsap.timeline({ paused: true }),
  logo: document.querySelector(".logo"),
};

// Core du Slider (carrousel)
// axis: "x" (droite -> gauche) | "y" (haut -> bas)
// ui: { pagination: true|false, arrows: true|false }
export function slider(onComplete, axis = "x", ui = { pagination: false, arrows: false }) {
  const gsap = window.gsap;

  // ===========================================================================
  // OPTIONS + DURÉES
  // ===========================================================================
  const displayTime = 2;
  const transitionTime = 1.5;

  const pagination = ui.pagination; // true | false
  const arrows = ui.arrows;         // true | false

  const thresholdRatio = 0.15;

  // ===========================================================================
  // DOM
  // ===========================================================================
  const stage = document.querySelector(".carousel");
  const track = document.querySelector(".carousel__track");
  const slides = Array.from(track.querySelectorAll(".slide"));
  const images = Array.from(stage.querySelectorAll("img"));

  // Host UI = extérieur du carrousel (dans .ad)
  const uiHost = stage.closest(".ad");

  // Empêche le drag natif des images
  stage.addEventListener("dragstart", (e) => e.preventDefault());
  images.forEach((img) => (img.draggable = false));

  // Nettoyage UI (utile avec Vite/HMR)
  uiHost.querySelectorAll(".carousel__arrow, .carousel__pagination").forEach((el) => el.remove());

  // ===========================================================================
  // Metrics
  // ===========================================================================
  const stageRect = stage.getBoundingClientRect();
  const uiHostRect = uiHost.getBoundingClientRect();
  const slideRect = slides[0].getBoundingClientRect();

  const stageW = stageRect.width;
  const stageH = stageRect.height;

  const slideW = slideRect.width;
  const slideH = slideRect.height;

  const style0 = getComputedStyle(slides[0]);
  const gap =
    axis === "y"
      ? (parseFloat(style0.marginBottom) || parseFloat(style0.marginRight) || 0)
      : (parseFloat(style0.marginRight) || 0);

  const centerX = (stageW - slideW) / 2;
  const centerY = (stageH - slideH) / 2;

  const stepX = slideW + gap;
  const stepY = slideH + gap;

  const lastIndex = slides.length - 1;

  function pos(i) {
    return axis === "y" ? (centerY + i * stepY) : (centerX - i * stepX);
  }

  // ===========================================================================
  // Layout (core)
  // ===========================================================================
  if (axis === "y") {
    track.style.display = "block";
    track.style.position = "relative";
    track.style.width = `${slideW}px`;
    track.style.height = `${slideH}px`;

    slides.forEach((s, i) => {
      s.style.position = "absolute";
      s.style.left = "0px";
      s.style.top = "0px";
      s.style.marginRight = "0px";
      s.style.marginBottom = "0px";

      gsap.set(s, { x: 0, y: -i * stepY });
    });

    gsap.set(track, { x: centerX, y: centerY - slideH });
  } else {
    track.style.display = "flex";
    track.style.flexDirection = "row";

    slides.forEach((s) => {
      s.style.position = "";
      s.style.left = "";
      s.style.top = "";
      s.style.marginBottom = "";
      gsap.set(s, { y: 0 });
    });

    gsap.set(track, { x: centerX + stepX, y: centerY });
  }

  gsap.set(stage, { autoAlpha: 1 });
  gsap.set(slides, { autoAlpha: 0 });

  // ===========================================================================
  // UI optionnelle (hors .carousel, dans .ad)
  // ===========================================================================
  let dots = [];
  let prevBtn = null;
  let nextBtn = null;
  let paginationRoot = null;

  function syncPagination(activeIndex) {
    dots.forEach((d, i) => d.classList.toggle("is-active", i === activeIndex));
  }

  // Positionne la UI dans le repère de .ad (uiHost)
  function placeUI() {
    const sRect = stage.getBoundingClientRect();
    const hRect = uiHost.getBoundingClientRect();

    const sx = sRect.left - hRect.left; // x de la zone carousel dans .ad
    const sy = sRect.top - hRect.top;   // y de la zone carousel dans .ad

    // Flèches
    if (prevBtn && nextBtn) {
      if (axis === "y") {
        // Haut / bas
        prevBtn.style.left = `${sx + sRect.width / 2 - 16}px`;
        prevBtn.style.top = `${sy + 8}px`;

        nextBtn.style.left = `${sx + sRect.width / 2 - 16}px`;
        nextBtn.style.top = `${sy + sRect.height - 32 - 8}px`;
      } else {
        // Gauche / droite
        prevBtn.style.left = `${sx + 8}px`;
        prevBtn.style.top = `${sy + sRect.height / 2 - 16}px`;

        nextBtn.style.left = `${sx + sRect.width - 32 - 8}px`;
        nextBtn.style.top = `${sy + sRect.height / 2 - 16}px`;
      }
    }

    // Pagination (centrée en bas de la zone carousel)
    if (paginationRoot) {
      paginationRoot.style.left = `${sx + sRect.width / 2}px`;
      paginationRoot.style.top = `${sy + sRect.height - 8}px`;
    }
  }

  function mountPagination(goTo) {
    paginationRoot = document.createElement("div");
    paginationRoot.className = "carousel__pagination";

    dots = slides.map((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "carousel__dot";
      b.addEventListener("click", () => goTo(i));
      paginationRoot.appendChild(b);
      return b;
    });

    uiHost.appendChild(paginationRoot);
    syncPagination(0);
  }

  function mountArrows(goTo) {
    prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.className = "carousel__arrow carousel__arrow--prev";
    prevBtn.textContent = axis === "y" ? "▲" : "‹";
    prevBtn.addEventListener("click", () => goTo(currentIndex - 1));

    nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "carousel__arrow carousel__arrow--next";
    nextBtn.textContent = axis === "y" ? "▼" : "›";
    nextBtn.addEventListener("click", () => goTo(currentIndex + 1));

    uiHost.appendChild(prevBtn);
    uiHost.appendChild(nextBtn);
  }

  // ===========================================================================
  // Timeline + interactions
  // ===========================================================================
  let tl = null;
  let currentIndex = 0;

  let hoverPauseRequested = false;
  let isTransitioning = false;

  function buildTimeline(startIndex, fromOffscreen) {
    tl && tl.kill();

    gsap.set(slides, { autoAlpha: 0 });
    gsap.set(slides[startIndex], { autoAlpha: 1 });

    gsap.set(track, axis === "y" ? { x: centerX, y: pos(startIndex) } : { x: pos(startIndex), y: centerY });

    if (fromOffscreen && startIndex === 0) {
      gsap.set(slides[0], { autoAlpha: 0 });
      gsap.set(track, axis === "y" ? { y: centerY - slideH } : { x: centerX + stepX });
    }

    const t = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      onComplete,
    });

    currentIndex = startIndex;
    dots.length && syncPagination(currentIndex);

    function maybePauseAfterMove() {
      isTransitioning = false;
      hoverPauseRequested && t.pause();
    }

    if (fromOffscreen && startIndex === 0) {
      isTransitioning = true;

      t.to(track, { [axis]: pos(0), duration: transitionTime }, 0)
        .to(slides[0], { autoAlpha: 1, duration: transitionTime }, 0)
        .add(maybePauseAfterMove, transitionTime);
    }

    t.to({}, { duration: displayTime });

    for (let i = startIndex; i < lastIndex; i++) {
      const next = i + 1;
      const label = `to${next + 1}`;

      t.add(() => { isTransitioning = true; }, label);

      t.to(track, { [axis]: pos(next), duration: transitionTime }, label)
        .to(slides[i], { autoAlpha: 0, duration: transitionTime }, label)
        .to(
          slides[next],
          {
            autoAlpha: 1,
            duration: transitionTime,
            onComplete: () => {
              currentIndex = next;
              dots.length && syncPagination(currentIndex);
              next === lastIndex && console.log("Dernière slide affichée");
            },
          },
          label
        )
        .add(maybePauseAfterMove, label + "+=" + transitionTime)
        .to({}, { duration: displayTime });
    }

    const outPos = axis === "y" ? (pos(lastIndex) + stepY) : (centerX - slides.length * stepX);

    t.add(() => { isTransitioning = true; }, "out");

    t.to(track, { [axis]: outPos, duration: transitionTime }, "out")
      .to(slides[lastIndex], { autoAlpha: 0, duration: transitionTime }, "out")
      .add(() => { isTransitioning = false; }, "out+=" + transitionTime);

    return t;
  }

  function goTo(index) {
    const target = Math.max(0, Math.min(lastIndex, index));

    tl && tl.kill();

    if (target === currentIndex) {
      tl = buildTimeline(currentIndex, false);
      hoverPauseRequested && tl.pause();
      return;
    }

    isTransitioning = true;

    gsap.timeline({
      defaults: { ease: "power2.inOut" },
      onComplete: () => {
        currentIndex = target;
        dots.length && syncPagination(currentIndex);

        isTransitioning = false;
        tl = buildTimeline(target, false);
        hoverPauseRequested && tl.pause();
      },
    })
      .to(track, { [axis]: pos(target), duration: transitionTime }, 0)
      .to(slides[currentIndex], { autoAlpha: 0, duration: transitionTime }, 0)
      .to(slides[target], { autoAlpha: 1, duration: transitionTime }, 0);
  }

  // UI : montage si activé + placement
  pagination && mountPagination(goTo);
  arrows && mountArrows(goTo);
  (pagination || arrows) && placeUI();

  // Drag / swipe (pointer)
  let isDragging = false;
  let pointerStart = 0;
  let trackStart = 0;

  stage.style.userSelect = "none";
  stage.style.touchAction = axis === "y" ? "pan-x" : "pan-y";

  stage.addEventListener("pointerenter", () => {
    if (!tl || isDragging) return;
    hoverPauseRequested = true;
    !isTransitioning && tl.pause();
  });

  stage.addEventListener("pointerleave", () => {
    if (!tl || isDragging) return;
    hoverPauseRequested = false;
    tl.paused() && tl.resume();
  });

  stage.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    isDragging = true;

    stage.setPointerCapture(e.pointerId);
    tl && tl.pause();

    pointerStart = axis === "y" ? e.clientY : e.clientX;
    trackStart = gsap.getProperty(track, axis);
  });

  stage.addEventListener("pointermove", (e) => {
    if (!isDragging) return;

    const p = axis === "y" ? e.clientY : e.clientX;
    const delta = p - pointerStart;

    let nextPos = trackStart + delta;

    const a = pos(0);
    const b = pos(lastIndex);
    const minPos = Math.min(a, b);
    const maxPos = Math.max(a, b);

    nextPos < minPos && (nextPos = minPos);
    nextPos > maxPos && (nextPos = maxPos);

    gsap.set(track, { [axis]: nextPos });
  });

  stage.addEventListener("pointerup", (e) => {
    if (!isDragging) return;

    isDragging = false;
    stage.releasePointerCapture(e.pointerId);

    const p = axis === "y" ? e.clientY : e.clientX;
    const delta = p - pointerStart;

    const threshold = (axis === "y" ? slideH : slideW) * thresholdRatio;

    let target = currentIndex;

    if (Math.abs(delta) > threshold) {
      const dir = axis === "y" ? (delta > 0 ? 1 : -1) : (delta < 0 ? 1 : -1);
      target = currentIndex + dir;
    } else {
      const cur = gsap.getProperty(track, axis);
      target =
        axis === "y"
          ? Math.round((cur - centerY) / stepY)
          : Math.round((centerX - cur) / stepX);
    }

    goTo(target);
  });

  stage.addEventListener("pointercancel", () => {
    isDragging = false;
    tl && tl.resume();
  });

  // Start
  tl = buildTimeline(0, true);
  return tl;
}
