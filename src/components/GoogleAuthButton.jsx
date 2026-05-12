import { useEffect, useRef, useState } from "react";
import { FaSpinner } from "react-icons/fa";
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

const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

export default function GoogleAuthButton({ mode = "login", onAuthenticated, disabled = false }) {
  const initialized = useRef(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const endpoint = "/auth/google/login";

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

  const handleGoogleClick = () => {
    if (loading || disabled || !sdkReady) return;
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          toast.info("Google sign-in popup was blocked. Please allow popups and try again.");
        }
      });
    }
  };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || initialized.current) return;

    initialized.current = true;

    loadGoogleSdk()
      .then((google) => {
        if (!google?.accounts?.id) return;

        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
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
        style={{
          display: "flex",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          padding: "10px 16px",
          borderRadius: "12px",
          border: "2px solid #e5e7eb",
          backgroundColor: "#fff",
          fontSize: "14px",
          fontWeight: 600,
          color: "#9ca3af",
          cursor: "not-allowed",
        }}
      >
        <GoogleLogo />
        Continue with Google
      </button>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {(loading || disabled) && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "12px",
            backgroundColor: "rgba(255,255,255,0.7)",
          }}
        >
          <FaSpinner className="h-5 w-5 animate-spin" style={{ color: "#4285F4" }} />
        </div>
      )}
      <button
        type="button"
        onClick={handleGoogleClick}
        disabled={!sdkReady || loading || disabled}
        style={{
          display: "flex",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          padding: "10px 16px",
          borderRadius: "12px",
          border: "2px solid #e5e7eb",
          backgroundColor: "#fff",
          fontSize: "14px",
          fontWeight: 600,
          color: "#374151",
          cursor: sdkReady && !loading && !disabled ? "pointer" : "not-allowed",
          opacity: sdkReady && !loading && !disabled ? 1 : 0.6,
          transition: "background-color 0.2s, border-color 0.2s, box-shadow 0.2s",
          boxShadow: "none",
        }}
        onMouseEnter={(e) => {
          if (sdkReady && !loading && !disabled) {
            e.currentTarget.style.backgroundColor = "#f9fafb";
            e.currentTarget.style.borderColor = "#d1d5db";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#fff";
          e.currentTarget.style.borderColor = "#e5e7eb";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <GoogleLogo />
        {loading ? (
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <FaSpinner className="animate-spin" style={{ fontSize: "14px" }} />
            Connecting...
          </span>
        ) : !sdkReady ? (
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <FaSpinner className="animate-spin" style={{ fontSize: "14px" }} />
            Loading...
          </span>
        ) : (
          "Continue with Google"
        )}
      </button>
    </div>
  );
}
