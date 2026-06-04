// utils/loadLayer.js

export const loadLayerScript = () => {
  return new Promise((resolve, reject) => {
    if (window.Layer) {
      resolve(window.Layer);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://payments.open.money/layer";
    script.async = true;

    script.onload = () => resolve(window.Layer);
    script.onerror = () =>
      reject(new Error("Failed to load payment gateway"));

    document.body.appendChild(script);
  });
};