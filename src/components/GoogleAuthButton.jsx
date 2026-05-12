import { useEffect, useRef, useState } from "react";
import { FaGoogle, FaSpinner } from "react-icons/fa";
import { toast } from "react-toastify";
import apiCall from "../utils/api";
import { getPreciseLocation } from "../utils/geolocation";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const GOOGLE_SCRIPT_ID = "google-identity-services-sdk";
const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

const loadGoogleSdk = () =>
  new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve(window.google);
      return;
    }

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.google), { once: true });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = reject;
    document.head.appendChild(script);
  });

export default function GoogleAuthButton({ mode = "login", onAuthenticated, disabled = false }) {
  const buttonRef = useRef(null);
  const initialized = useRef(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const label = mode === "signup" ? "Sign up with Google" : "Login with Google";
  const endpoint = mode === "signup" ? "/auth/google/signup" : "/auth/google/login";

  const handleCredentialResponse = async (credentialResponse) => {
    if (loading || disabled) return;

    if (!credentialResponse?.credential) {
      toast.error("Google did not return a valid credential.");
      return;
    }

    try {
      setLoading(true);
      let locationData = null;

      try {
        locationData = await getPreciseLocation();
      } catch (error) {
        console.warn("Precise location unavailable during Google auth:", error);
      }

      const payload = {
        credential: credentialResponse.credential,
      };

      if (locationData) {
        payload.latitude = locationData.latitude;
        payload.longitude = locationData.longitude;
        payload.location_accuracy = locationData.accuracy;
      }

      const response = await apiCall(endpoint, "POST", payload);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Google authentication failed.");
      }

      if (!data.token) {
        throw new Error("Google authentication did not return a login token.");
      }

      toast.success(mode === "signup" ? "Signup successful" : "Login successful");
      await onAuthenticated(data.token);
    } catch (error) {
      toast.error(error.message || "Google authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || initialized.current) return;

    initialized.current = true;

    loadGoogleSdk()
      .then((google) => {
        if (!buttonRef.current || !google?.accounts?.id) return;

        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
        });

        google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          type: "standard",
          shape: "rectangular",
          text: mode === "signup" ? "signup_with" : "signin_with",
          width: buttonRef.current.offsetWidth || 320,
        });

        setSdkReady(true);
      })
      .catch(() => {
        toast.error("Google sign-in could not be loaded.");
      });
  }, []);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <button
        type="button"
        onClick={() => toast.error("Google Client ID is not configured.")}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-500"
      >
        <FaGoogle />
        {label}
      </button>
    );
  }

  return (
    <div className="relative w-full">
      {(loading || disabled) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/70">
          <FaSpinner className="h-5 w-5 animate-spin text-blue-600" />
        </div>
      )}
      {!sdkReady && (
        <button
          type="button"
          disabled
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-500"
        >
          <FaSpinner className="h-4 w-4 animate-spin" />
          Loading Google...
        </button>
      )}
      <div className={sdkReady ? "w-full overflow-hidden rounded-xl" : "hidden"} ref={buttonRef} />
    </div>
  );
}
