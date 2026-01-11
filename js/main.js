// js/main.js

// Elément du DOM et timelines GSAP
export const Ads2026 = {
  timeline: gsap.timeline({}),
  introTimeline: gsap.timeline({}),
  outroTimeline: gsap.timeline({ paused: true }),

  logo: document.querySelector(".logo"),
};

// Core du Slider (carrousel)
// axis: "x" (droite -> gauche) | "y" (haut -> bas)
export function slider(onComplete, axis = "x") {
  const gsap = window.gsap;

  const stage = document.querySelector(".carousel");
  const track = document.querySelector(".carousel__track");
  const slides = Array.from(track.querySelectorAll(".slide"));

  const stageRect = stage.getBoundingClientRect();
  const slideRect = slides[0].getBoundingClientRect();

  const stageW = stageRect.width;
  const stageH = stageRect.height;

  const slideW = slideRect.width;
  const slideH = slideRect.height;

  // Gap récupéré depuis le CSS (margin-right des slides)
  const gap = parseFloat(getComputedStyle(slides[0]).marginRight) || 0;

  const centerX = (stageW - slideW) / 2;
  const centerY = (stageH - slideH) / 2;

  const displayTime = 2;       // temps pendant lequel une slide reste affichée
  const transitionTime = 1.5;  // durée du défilement + fade

  const lastIndex = slides.length - 1;

  const stepX = slideW + gap;
  const stepY = slideH + gap;

  // Position du track quand la slide i est centrée
  // - X : on va vers la gauche
  // - Y : on descend (haut -> bas)
  function pos(i) {
    return axis === "y" ? (centerY + i * stepY) : (centerX - i * stepX);
  }

  // ---------------------------------------------------------------------------
  // LAYOUT (core)
  // - X : layout CSS en flex-row (classique)
  // - Y : slides en "pile" (absolute) + track qui descend
  // ---------------------------------------------------------------------------
  if (axis === "y") {
    track.style.display = "block";
    track.style.flexDirection = "";
    track.style.position = "relative";
    track.style.width = `${slideW}px`;
    track.style.height = `${slideH}px`;

    slides.forEach((s, i) => {
      s.style.position = "absolute";
      s.style.left = "0px";
      s.style.top = "0px";
      s.style.marginRight = "0px";
      s.style.marginBottom = "0px";

      // Slide 2/3 sont placées au-dessus : quand le track descend, elles "entrent" par le haut
      gsap.set(s, { x: 0, y: -i * stepY });
    });

    // Départ demandé : track en haut (y = -250px si slideH=250 et centerY=0)
    gsap.set(track, { x: centerX, y: centerY - slideH });
  } else {
    track.style.display = "flex";
    track.style.flexDirection = "row";
    track.style.position = "";
    track.style.width = "";
    track.style.height = "";

    slides.forEach((s) => {
      s.style.position = "";
      s.style.left = "";
      s.style.top = "";
      s.style.marginBottom = "";
      gsap.set(s, { y: 0 }); // au cas où on revient du mode Y
    });

    // Départ hors champ à droite
    gsap.set(track, { x: centerX + stepX, y: centerY });
  }

  // Pas de flash
  gsap.set(stage, { autoAlpha: 1 });
  gsap.set(slides, { autoAlpha: 0 });

  // ---------------------------------------------------------------------------
  // Timeline (avec rebuild pour drag / swipe)
  // ---------------------------------------------------------------------------
  let tl = null;
  let currentIndex = 0;

  // Hover amélioré :
  // - si on hover pendant un défilement, on laisse finir le défilement puis on pause
  let hoverPauseRequested = false;
  let isTransitioning = false;

  function buildTimeline(startIndex, fromOffscreen) {
    tl && tl.kill();

    // Etat de départ
    gsap.set(slides, { autoAlpha: 0 });
    gsap.set(slides[startIndex], { autoAlpha: 1 });

    // Position "centrée"
    if (axis === "y") gsap.set(track, { x: centerX, y: pos(startIndex) });
    else gsap.set(track, { x: pos(startIndex), y: centerY });

    // Entrée depuis le bord (uniquement au tout début)
    if (fromOffscreen && startIndex === 0) {
      gsap.set(slides[0], { autoAlpha: 0 });
      if (axis === "y") gsap.set(track, { y: centerY - slideH });   // haut
      else gsap.set(track, { x: centerX + stepX });                 // droite
    }

    const t = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      onComplete,
    });

    currentIndex = startIndex;

    // Pause "au bon moment" si un hover a été demandé
    function maybePauseAfterMove() {
      isTransitioning = false;
      if (hoverPauseRequested) t.pause();
    }

    // Entrée (défilement en cours)
    if (fromOffscreen && startIndex === 0) {
      isTransitioning = true;

      t.to(track, { [axis]: pos(0), duration: transitionTime }, 0)
        .to(slides[0], { autoAlpha: 1, duration: transitionTime }, 0)
        .add(maybePauseAfterMove, transitionTime);
    } else {
      isTransitioning = false;
    }

    // Pause sur la slide courante
    t.to({}, { duration: displayTime });

    // Transitions dynamiques (de startIndex jusqu'à la fin)
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
              next === lastIndex && console.log("Dernière slide affichée");
            },
          },
          label
        )
        .add(maybePauseAfterMove, label + "+=" + transitionTime)
        .to({}, { duration: displayTime });
    }

    // Sortie finale
    const outPos =
      axis === "y"
        ? (pos(lastIndex) + stepY)
        : (centerX - slides.length * stepX);

    t.add(() => { isTransitioning = true; }, "out");

    t.to(track, { [axis]: outPos, duration: transitionTime }, "out")
      .to(slides[lastIndex], { autoAlpha: 0, duration: transitionTime }, "out")
      .add(() => { isTransitioning = false; }, "out+=" + transitionTime);

    return t;
  }

  // ---------------------------------------------------------------------------
  // Interactions (core, par défaut)
  // 1) Hover : pause uniquement à la fin du défilement en cours
  // 2) Drag souris
  // 3) Swipe mobile (même logique via pointer events)
  // ---------------------------------------------------------------------------
  let isDragging = false;
  let pointerStart = 0;
  let trackStart = 0;

  stage.style.userSelect = "none";
  stage.style.touchAction = axis === "y" ? "pan-x" : "pan-y";

  stage.addEventListener("pointerenter", () => {
    if (isDragging || !tl) return;
    hoverPauseRequested = true;

    // Si on est déjà dans une phase "stable", on pause tout de suite
    if (!isTransitioning) tl.pause();
  });

  stage.addEventListener("pointerleave", () => {
    if (isDragging || !tl) return;
    hoverPauseRequested = false;

    // Si on était en pause à cause du hover, on reprend
    if (tl.paused()) tl.resume();
  });

  stage.addEventListener("pointerdown", (e) => {
    isDragging = true;
    stage.setPointerCapture(e.pointerId);

    tl && tl.pause();

    pointerStart = axis === "y" ? e.clientY : e.clientX;
    trackStart = gsap.getProperty(track, axis);

    stage.style.cursor = "grabbing";
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

    if (nextPos < minPos) nextPos = minPos;
    if (nextPos > maxPos) nextPos = maxPos;

    gsap.set(track, { [axis]: nextPos });
  });

  stage.addEventListener("pointerup", (e) => {
    if (!isDragging) return;

    isDragging = false;
    stage.releasePointerCapture(e.pointerId);
    stage.style.cursor = "";

    const p = axis === "y" ? e.clientY : e.clientX;
    const delta = p - pointerStart;

    // Seuil : si le geste est assez marqué => on force le slide suivant/précédent
    const threshold = (axis === "y" ? slideH : slideW) * 0.15;

    let target = currentIndex;

    if (Math.abs(delta) > threshold) {
      // X : gauche => next | droite => prev
      // Y : bas   => next | haut   => prev
      const dir = axis === "y" ? (delta > 0 ? 1 : -1) : (delta < 0 ? 1 : -1);
      target = currentIndex + dir;
      if (target < 0) target = 0;
      if (target > lastIndex) target = lastIndex;
    } else {
      // Snap au plus proche
      const cur = gsap.getProperty(track, axis);
      target =
        axis === "y"
          ? Math.round((cur - centerY) / stepY)
          : Math.round((centerX - cur) / stepX);

      if (target < 0) target = 0;
      if (target > lastIndex) target = lastIndex;
    }

    gsap.to(track, {
      [axis]: pos(target),
      duration: 0.35,
      ease: "power2.out",
      onComplete: () => {
        gsap.set(slides, { autoAlpha: 0 });
        gsap.set(slides[target], { autoAlpha: 1 });

        // On reprend depuis target (sans rejouer l’entrée depuis le bord)
        tl = buildTimeline(target, false);

        // Si on est toujours hover, on pause immédiatement (phase stable)
        if (hoverPauseRequested) tl.pause();
      },
    });
  });

  stage.addEventListener("pointercancel", () => {
    isDragging = false;
    stage.style.cursor = "";
    tl && tl.resume();
  });

  // ---------------------------------------------------------------------------
  // Lancement initial : entrée depuis le bord, puis autoplay
  // ---------------------------------------------------------------------------
  tl = buildTimeline(0, true);
  return tl;
}
