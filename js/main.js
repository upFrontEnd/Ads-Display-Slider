// Elément du DOM et timelines GSAP 
export const Ads2026 = {
	timeline: gsap.timeline({}),
	introTimeline: gsap.timeline({}),
	outroTimeline: gsap.timeline({ paused: true }),

	logo: document.querySelector(".logo"),
};

// Core du Slider (carrousel)
export function slider(onComplete) {
  const gsap = window.gsap;

  const stage = document.querySelector(".carousel");
  const track = document.querySelector(".carousel__track");
  const slides = Array.from(track.querySelectorAll(".slide"));

  const stageW = stage.getBoundingClientRect().width;
  const slideW = slides[0].getBoundingClientRect().width;
  const gap = parseFloat(getComputedStyle(slides[0]).marginRight) || 0;

  const stepX = slideW + gap;
  const centerX = (stageW - slideW) / 2;

  const displayTime = 2;
  const transitionTime = 1.5;

  const lastIndex = slides.length - 1;

  gsap.set(track, { x: centerX + stepX });
  gsap.set(slides, { autoAlpha: 0 });
	gsap.set(stage, { autoAlpha: 1 });


  const tl = gsap.timeline({
    defaults: { ease: "power2.inOut" },
    onComplete
  });

  tl.to(track,     { x: centerX, duration: transitionTime }, 0)
    .to(slides[0], { autoAlpha: 1, duration: transitionTime }, 0);

  tl.to({}, { duration: displayTime });

  slides.slice(0, -1).forEach((_, i) => {
    const next = i + 1;
    const label = `to${next + 1}`;

    tl.to(track,        { x: centerX - next * stepX, duration: transitionTime }, label)
      .to(slides[i],    { autoAlpha: 0,               duration: transitionTime }, label)
      .to(slides[next], {
        autoAlpha: 1,
        duration: transitionTime,
        onComplete: () => (next === lastIndex) && console.log("Dernière slide affichée")
      }, label)
      .to({}, { duration: displayTime });
  });

  tl.to(track,             { x: centerX - slides.length * stepX, duration: transitionTime }, "out")
    .to(slides[lastIndex], { autoAlpha: 0,                       duration: transitionTime }, "out");

  return tl;
}
