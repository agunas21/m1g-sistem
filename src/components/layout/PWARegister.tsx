"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("/sw.js").then(
          function (registration) {
            console.log("Service Worker registered with scope: ", registration.scope);

            // Force immediate update check on load
            registration.update();

            if (registration.waiting) {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }

            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log("New Service Worker version installed, reloading...");
                    window.location.reload();
                  }
                };
              }
            };
          },
          function (err) {
            console.log("Service Worker registration failed: ", err);
          }
        );
      });
    }
  }, []);

  return null;
}
