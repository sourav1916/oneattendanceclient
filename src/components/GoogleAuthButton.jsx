import { useEffect, useRef, useState, useCallback } from "react";
import { FaSpinner } from "react-icons/fa";
import { toast } from "react-toastify";
import apiCall from "../utils/api";
import { getPreciseLocation } from "../utils/geolocation";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const GOOGLE_SCRIPT_ID = "google-identity-services-sdk";
const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

// ─── Load the GSI script exactly once ────────────────────────────────────────
let gsiLoadPromise = null;

const loadGoogleSdk = () => {
  if (gsiLoadPromise) return gsiLoadPromise;

  gsiLoadPromise = new Promise((resolve, reject) => {
    // Already loaded
    if (window.google?.accounts?.id) {
      resolve(window.google);
      return;
    }

    // Script tag already injected (e.g. by another component)
    const existing = document.getElementById(GOOGLE_SCRIPT_ID);
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google), { once: true });
      existing.addEventListener("error", (e) => { gsiLoadPromise = null; reject(e); }, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id    = GOOGLE_SCRIPT_ID;
    script.src   = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload  = () => resolve(window.google);
    script.onerror = (e) => { gsiLoadPromise = null; reject(e); };
    document.head.appendChild(script);
  });

  return gsiLoadPromise;
};

// ─── Tiny Google-coloured SVG logo ───────────────────────────────────────────
const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24 24 0 0 0 0 21.56l7.98-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────
/**
 * GoogleAuthButton
 *
 * Strategy:
 *   1. Renders Google's *own* branded button inside a hidden div so the
 *      sign-in popup is opened by Google's code — not by our code. This
 *      bypasses every browser's "popup blocked" heuristic because the click
 *      originates directly from Google's iframe/button.
 *   2. Overlays a styled <button> on top that is purely visual; clicks are
 *      forwarded to Google's hidden button via a ref.
 *   3. One-Tap / FedCM is also initialised as an opportunistic fallback for
 *      browsers / OS combos that support it (Chrome on desktop, Android
 *      WebView, etc.). It is silently skipped when unsupported.
 */
export default function GoogleAuthButton({
  mode     = "login",
  onAuthenticated,
  disabled = false,
}) {
  const googleBtnContainerRef = useRef(null); // hidden div Google renders into
  const [loading,   setLoading]   = useState(false);
  const [sdkReady,  setSdkReady]  = useState(false);
  const callbackRef = useRef(null); // always-fresh callback ref
  const locationPromiseRef = useRef(null); // location fetch Promise (started on user click)

  const endpoint = "/auth/continue/google";

  // ── credential handler (kept in a ref so Google's callback never goes stale)
  const handleCredentialResponse = useCallback(async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      toast.error("Google did not return a valid credential.");
      return;
    }

    try {
      setLoading(true);

      // Await the location promise started on click (may already be resolved)
      let loc = null;
      try {
        if (locationPromiseRef.current) {
          loc = await locationPromiseRef.current;
        }
      } catch (_) { /* location unavailable — send empty strings */ }

      const payload = {
        credential: credentialResponse.credential,
        platform:   "web",
        latitude:   loc?.latitude  ?? "",
        longitude:  loc?.longitude ?? "",
      };

      const response = await apiCall(endpoint, "POST", payload);
      const json     = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(json.message || "Google authentication failed.");
      
      const token = json.data?.token || json.token;
      if (!token)  throw new Error("Google authentication did not return a login token.");

      toast.success(mode === "signup" ? "Signup successful 🎉" : "Login successful 🎉");
      await onAuthenticated(token);
    } catch (err) {
      toast.error(err.message || "Google authentication failed.");
    } finally {
      setLoading(false);
    }
  }, [mode, onAuthenticated]); 
  // keep the ref fresh
  callbackRef.current = handleCredentialResponse;

  // ── initialise GSI once
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    loadGoogleSdk()
      .then((google) => {
        if (!google?.accounts?.id) return;

        // Initialize with a stable wrapper so `callbackRef.current` is always fresh
        google.accounts.id.initialize({
          client_id:             GOOGLE_CLIENT_ID,
          callback:              (resp) => callbackRef.current(resp),
          auto_select:           false,   // don't silently sign in
          cancel_on_tap_outside: true,
          // FedCM / One-Tap — opportunistic, silently ignored where unsupported
          use_fedcm_for_prompt:  true,
        });

        // Render Google's own button into our hidden container
        if (googleBtnContainerRef.current) {
          google.accounts.id.renderButton(googleBtnContainerRef.current, {
            type:          "standard",
            shape:         "rectangular",
            theme:         "outline",
            text:          mode === "signup" ? "signup_with" : "signin_with",
            size:          "large",
            width:         "400", // generous — we clip it to the container anyway
            logo_alignment: "left",
          });
        }

        setSdkReady(true);
      })
      .catch(() => toast.error("Google Sign-In could not be loaded. Please refresh."));
  }, []); // run once — mode intentionally omitted (button text is cosmetic only)

  // ── forward our visible button's click to Google's hidden button
  const handleVisibleButtonClick = () => {
    if (loading || disabled || !sdkReady) return;

    // Start location fetch on user gesture so the browser shows the permission prompt
    locationPromiseRef.current = getPreciseLocation().catch(() => null);

    // The rendered button is the first <div> or <iframe> child Google puts in
    const googleBtn =
      googleBtnContainerRef.current?.querySelector('[role="button"]') ||
      googleBtnContainerRef.current?.querySelector("div[tabindex='0']") ||
      googleBtnContainerRef.current?.firstElementChild;

    if (googleBtn) {
      googleBtn.click();
    } else {
      // Absolute fallback — trigger One-Tap / FedCM prompt
      window.google?.accounts?.id?.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          toast.info(
            "Pop-up was blocked. Please allow pop-ups for this site in your browser settings, then try again."
          );
        }
      });
    }
  };

  // ── no client-id configured
  if (!GOOGLE_CLIENT_ID) {
    return (
      <button type="button" disabled style={styles.btn("#9ca3af", "not-allowed")}>
        <GoogleLogo />
        Continue with Google
      </button>
    );
  }

  const isDisabled = !sdkReady || loading || disabled;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {/*
        Hidden container — Google renders its real button here.
        We keep it in the DOM (visibility hidden, not display:none) so
        Google can still measure it and the click event works correctly.
      */}
      <div
        ref={googleBtnContainerRef}
        style={{
          position:   "absolute",
          top:        0,
          left:       0,
          width:      "100%",
          height:     "100%",
          overflow:   "hidden",
          opacity:    0,           // invisible but interactive
          zIndex:     1,           // sits above our button so clicks reach it
          pointerEvents: isDisabled ? "none" : "auto",
        }}
        aria-hidden="true"
      />

      {/* Our styled button — purely visual */}
      <button
        type="button"
        onClick={handleVisibleButtonClick}
        disabled={isDisabled}
        aria-label="Continue with Google"
        style={{
          position:        "relative",
          display:         "flex",
          width:           "100%",
          alignItems:      "center",
          justifyContent:  "center",
          gap:             "10px",
          padding:         "10px 16px",
          borderRadius:    "12px",
          border:          "2px solid #e5e7eb",
          backgroundColor: "#fff",
          fontSize:        "14px",
          fontWeight:      600,
          color:           isDisabled ? "#9ca3af" : "#374151",
          cursor:          isDisabled ? "not-allowed" : "pointer",
          opacity:         isDisabled ? 0.6 : 1,
          transition:      "background-color 0.2s, border-color 0.2s, box-shadow 0.2s",
          zIndex:          0,
        }}
        onMouseEnter={(e) => {
          if (!isDisabled) {
            e.currentTarget.style.backgroundColor = "#f9fafb";
            e.currentTarget.style.borderColor     = "#d1d5db";
            e.currentTarget.style.boxShadow       = "0 2px 8px rgba(0,0,0,0.08)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#fff";
          e.currentTarget.style.borderColor     = "#e5e7eb";
          e.currentTarget.style.boxShadow       = "none";
        }}
      >
        <GoogleLogo />

        {loading ? (
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <FaSpinner style={{ fontSize: "14px", animation: "spin 1s linear infinite" }} />
            Connecting…
          </span>
        ) : !sdkReady ? (
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <FaSpinner style={{ fontSize: "14px", animation: "spin 1s linear infinite" }} />
            Loading…
          </span>
        ) : (
          `Continue with Google`
        )}
      </button>

      {/* Spinner keyframe (only needs to exist once in the document) */}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}