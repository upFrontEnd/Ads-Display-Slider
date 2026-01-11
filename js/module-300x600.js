import { slider, Ads2026 } from "./main.js";

// Départ
Ads2026.introTimeline.to(Ads2026.logo, { opacity: 1, duration: 2 });

// Carrousel (démarre quand le départ est fini)
Ads2026.introTimeline.eventCallback("onComplete", () => {
  slider(() => {
		Ads2026.outroTimeline.play(0);
	}, "y");	
});

// Fin (placeholder)
Ads2026.outroTimeline.to(Ads2026.logo, { opacity: 0, duration: 0.6 });
