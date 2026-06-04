// utils/loadLayer.js

export const loadLayerScript = () => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Window is not available"));
  }

  if (window.Layer) {
    return Promise.resolve(window.Layer);
  }

  if (!window.__layerScriptPromise) {
    window.__layerScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[data-layer-sdk="true"]');

      const finalize = () => {
        if (window.Layer) {
          resolve(window.Layer);
        } else {
          reject(new Error("Layer SDK failed to initialize"));
        }
      };

      if (existingScript) {
        existingScript.addEventListener("load", finalize, { once: true });
        existingScript.addEventListener("error", () => {
          reject(new Error("Failed to load payment gateway"));
        }, { once: true });

        if (window.Layer) {
          finalize();
        }
        return;
      }

      const script = document.createElement("script");
      script.src = "https://payments.open.money/layer";
      script.async = true;
      script.defer = true;
      script.setAttribute("data-layer-sdk", "true");

      script.onload = finalize;
      script.onerror = () => {
        reject(new Error("Failed to load payment gateway"));
      };

      document.body.appendChild(script);
    }).finally(() => {
      window.__layerScriptPromise = null;
    });
  }

  return window.__layerScriptPromise;
};