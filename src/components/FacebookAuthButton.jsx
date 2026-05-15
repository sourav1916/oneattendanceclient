import { useEffect, useState, useCallback } from "react";
import { FaSpinner, FaFacebook } from "react-icons/fa";
import { toast } from "react-toastify";
import apiCall from "../utils/api";
import { getPreciseLocation } from "../utils/geolocation";

const FB_APP_ID = process.env.REACT_APP_FACEBOOK_APP_ID;
const FB_SCRIPT_ID = "facebook-jssdk";
const FB_SCRIPT_SRC = "https://connect.facebook.net/en_US/sdk.js";

let fbLoadPromise = null;

const loadFacebookSdk = () => {
  // If already resolved successfully, return it
  if (fbLoadPromise) return fbLoadPromise;

  fbLoadPromise = new Promise((resolve, reject) => {
    // SDK already loaded and initialized
    if (window.FB) {
      resolve(window.FB);
      return;
    }

    // This callback is invoked by the FB SDK once the script loads
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: FB_APP_ID,
        cookie: true,
        xfbml: false,       // Don't auto-render social plugins (faster init)
        version: "v22.0",   // Use a current, supported Graph API version
      });

      // Confirm login state is ready before resolving
      window.FB.getLoginStatus(() => {
        resolve(window.FB);
      });
    };

    // Avoid injecting the script more than once
    if (!document.getElementById(FB_SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = FB_SCRIPT_ID;
      script.src = FB_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.crossOrigin = "anonymous";
      script.onerror = (e) => {
        fbLoadPromise = null; // Allow retry on next mount
        reject(new Error("Failed to load Facebook SDK script."));
      };
      document.head.appendChild(script);
    }
    // If the script tag exists but FB isn't ready yet, fbAsyncInit will still fire
  });

  return fbLoadPromise;
};

export default function FacebookAuthButton({
  mode = "login",
  onAuthenticated,
  disabled = false,
}) {
  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState(false);

  const endpoint = "/auth/continue/facebook";

  useEffect(() => {
    if (!FB_APP_ID) return;

    loadFacebookSdk()
      .then(() => {
        setSdkReady(true);
      })
      .catch((err) => {
        console.error("Facebook SDK load error:", err);
        setSdkError(true);
        fbLoadPromise = null; // Reset so user can retry by remounting
        toast.error("Facebook Sign-In could not be loaded. Please refresh the page.");
      });
  }, []);

  const handleFacebookLogin = useCallback(() => {
    if (loading || disabled || !sdkReady || !window.FB) return;

    // Trigger the Facebook login popup
    window.FB.login(
      (response) => {
        // User closed the popup or denied permissions
        if (!response.authResponse) {
          const status = response.status;
          if (status === "not_authorized") {
            toast.error("Please grant the required permissions to continue.");
          } else {
            // "unknown" status — user simply closed the dialog
            toast.error("Login was cancelled. Please try again.");
          }
          return;
        }

        // Proceed with the access token
        const processLogin = async () => {
          setLoading(true);
          try {
            const accessToken = response.authResponse.accessToken;

            let locationData = null;
            try {
              locationData = await getPreciseLocation();
            } catch (_) {
              // Location is optional — continue without it
            }

            const payload = { accessToken };
            if (locationData) {
              payload.latitude = locationData.latitude;
              payload.longitude = locationData.longitude;
              payload.location_accuracy = locationData.accuracy;
            }

            const res = await apiCall(endpoint, "POST", payload);
            const json = await res.json().catch(() => ({}));

            if (!res.ok) {
              throw new Error(json.message || "Facebook authentication failed.");
            }

            const token = json.data?.token || json.token;
            if (!token) {
              throw new Error("Facebook authentication did not return a login token.");
            }

            toast.success(mode === "signup" ? "Signup successful 🎉" : "Login successful 🎉");
            await onAuthenticated(token);
          } catch (err) {
            toast.error(err.message || "Facebook authentication failed.");
          } finally {
            setLoading(false);
          }
        };

        processLogin();
      },
      {
        scope: "public_profile,email",
        return_scopes: true,   // Confirms which scopes were actually granted
        auth_type: "rerequest", // Re-ask for permissions if previously denied
      }
    );
  }, [loading, disabled, sdkReady, mode, onAuthenticated]);

  // FB_APP_ID missing from .env
  if (!FB_APP_ID) {
    return (
      <button type="button" disabled style={{ ...buttonBaseStyle, color: "#9ca3af", cursor: "not-allowed", opacity: 0.6 }}>
        <FaFacebook size={20} color="#1877F2" />
        Continue with Facebook
      </button>
    );
  }

  // SDK failed to load
  if (sdkError) {
    return (
      <button type="button" disabled style={{ ...buttonBaseStyle, color: "#9ca3af", cursor: "not-allowed", opacity: 0.6 }}>
        <FaFacebook size={20} color="#1877F2" />
        Facebook unavailable
      </button>
    );
  }

  const isDisabled = !sdkReady || loading || disabled;

  return (
    <>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      <button
        type="button"
        onClick={handleFacebookLogin}
        disabled={isDisabled}
        aria-label="Continue with Facebook"
        style={{
          ...buttonBaseStyle,
          color: isDisabled ? "#9ca3af" : "#374151",
          cursor: isDisabled ? "not-allowed" : "pointer",
          opacity: isDisabled ? 0.6 : 1,
          transition: "background-color 0.2s, border-color 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={(e) => {
          if (!isDisabled) {
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
        {loading ? (
          <FaSpinner style={{ fontSize: "16px", animation: "spin 1s linear infinite" }} />
        ) : (
          <FaFacebook size={20} color="#1877F2" />
        )}

        {loading ? (
          "Connecting…"
        ) : !sdkReady ? (
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <FaSpinner style={{ fontSize: "14px", animation: "spin 1s linear infinite" }} />
            Loading…
          </span>
        ) : (
          `Continue with Facebook`
        )}
      </button>
    </>
  );
}

const buttonBaseStyle = {
  position: "relative",
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
};