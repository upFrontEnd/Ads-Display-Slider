// Elément du DOM et timelines GSAP 
export const Ads2026 = {
	timeline: gsap.timeline({}),
	introTimeline: gsap.timeline({}),
	outroTimeline: gsap.timeline({ paused: true }),

	logo: document.querySelector(".logo"),
};

// Core du Slider (carrousel)
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

  const styles = getComputedStyle(slides[0]);
  const gap =
    axis === "y"
      ? (parseFloat(styles.marginBottom) || parseFloat(styles.marginRight) || 0)
      : (parseFloat(styles.marginRight) || 0);

  const centerX = (stageW - slideW) / 2;
  const centerY = (stageH - slideH) / 2;

  const displayTime = 2;
  const transitionTime = 1.5;

  const lastIndex = slides.length - 1;

  // Setup (pas de flash)
  gsap.set(stage, { autoAlpha: 1 });
  gsap.set(slides, { autoAlpha: 0 });

  // MODE X : flex row (comme avant)
  // MODE Y : slides superposées et décalées au-dessus (pour entrer du haut vers le bas)
  if (axis === "y") {
    track.style.display = "block";
    track.style.flexDirection = "";
    track.style.position = "relative";
    track.style.width = `${slideW}px`;
    track.style.height = `${slideH}px`;

    const stepY = slideH + gap;

    slides.forEach((s, i) => {
      s.style.position = "absolute";
      s.style.left = "0px";
      s.style.top = "0px";
      s.style.marginRight = "0px";
      s.style.marginBottom = "0px";
      gsap.set(s, { x: 0, y: -i * stepY });
    });

    // IMPORTANT : départ track à -250px (si stage=250 et slide=250 => centerY=0)
    gsap.set(track, { x: centerX, y: centerY - slideH });

    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      onComplete,
    });

    // Slide 1 arrive du haut vers le centre
    tl.to(track, { y: centerY, duration: transitionTime }, 0)
      .to(slides[0], { autoAlpha: 1, duration: transitionTime }, 0);

    tl.to({}, { duration: displayTime });

    // Transitions : le track descend => la suivante vient du haut, la courante sort en bas
    slides.slice(0, -1).forEach((_, i) => {
      const next = i + 1;
      const label = `to${next + 1}`;

      tl.to(track, { y: centerY + next * stepY, duration: transitionTime }, label)
        .to(slides[i], { autoAlpha: 0, duration: transitionTime }, label)
        .to(slides[next], {
          autoAlpha: 1,
          duration: transitionTime,
          onComplete: () => (next === lastIndex) && console.log("Dernière slide affichée"),
        }, label)
        .to({}, { duration: displayTime });
    });

    // Sortie finale : le track continue de descendre, dernière slide fadeOut
    tl.to(track, { y: centerY + slides.length * stepY, duration: transitionTime }, "out")
      .to(slides[lastIndex], { autoAlpha: 0, duration: transitionTime }, "out");

    return tl;
  }

  // --- MODE X (inchangé) ---
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
    gsap.set(s, { y: 0 }); // au cas où tu as testé le mode y avant
  });

  const stepX = slideW + gap;

  gsap.set(track, { x: centerX + stepX, y: centerY });
  gsap.set(slides, { autoAlpha: 0 });

  const tl = gsap.timeline({
    defaults: { ease: "power2.inOut" },
    onComplete,
  });

  tl.to(track, { x: centerX, duration: transitionTime }, 0)
    .to(slides[0], { autoAlpha: 1, duration: transitionTime }, 0);

  tl.to({}, { duration: displayTime });

  slides.slice(0, -1).forEach((_, i) => {
    const next = i + 1;
    const label = `to${next + 1}`;

    tl.to(track, { x: centerX - next * stepX, duration: transitionTime }, label)
      .to(slides[i], { autoAlpha: 0, duration: transitionTime }, label)
      .to(slides[next], {
        autoAlpha: 1,
        duration: transitionTime,
        onComplete: () => (next === lastIndex) && console.log("Dernière slide affichée"),
      }, label)
      .to({}, { duration: displayTime });
  });

  tl.to(track, { x: centerX - slides.length * stepX, duration: transitionTime }, "out")
    .to(slides[lastIndex], { autoAlpha: 0, duration: transitionTime }, "out");

  return tl;
}




