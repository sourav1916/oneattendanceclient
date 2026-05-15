import { useEffect, useState, useCallback, useRef } from "react";
import { FaSpinner, FaFacebook } from "react-icons/fa";
import { toast } from "react-toastify";
import apiCall from "../utils/api";
import { getPreciseLocation } from "../utils/geolocation";

const FB_APP_ID = process.env.FACEBOOK_APP_ID;
const FB_SCRIPT_ID = "facebook-jssdk";
const FB_SCRIPT_SRC = "https://connect.facebook.net/en_US/sdk.js";

let fbLoadPromise = null;

const loadFacebookSdk = () => {
  if (fbLoadPromise) return fbLoadPromise;

  fbLoadPromise = new Promise((resolve, reject) => {
    // If FB is already loaded and initialized, resolve immediately
    if (window.FB && window.FB.init) {
      // Check if it's already initialized by trying a call or checking a flag
      // window.FB.init can be called multiple times safely usually
      try {
          window.FB.init({
              appId      : FB_APP_ID,
              cookie     : true,
              xfbml      : true,
              version    : 'v18.0'
          });
          resolve(window.FB);
          return;
      } catch (e) {
          console.warn("FB.init error on already loaded SDK:", e);
      }
    }

    // Set up the callback that Facebook SDK calls when loaded
    window.fbAsyncInit = function() {
      window.FB.init({
        appId      : FB_APP_ID,
        cookie     : true,
        xfbml      : true,
        version    : 'v18.0'
      });
      resolve(window.FB);
    };

    const existing = document.getElementById(FB_SCRIPT_ID);
    if (!existing) {
      const script = document.createElement("script");
      script.id = FB_SCRIPT_ID;
      script.src = FB_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.crossOrigin = "anonymous";
      script.onerror = (e) => {
        fbLoadPromise = null;
        reject(e);
      };
      document.head.appendChild(script);
    } else if (window.FB) {
        // If script exists and FB is available but fbAsyncInit wasn't called
        window.fbAsyncInit();
    }
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

  const endpoint = "/auth/continue/facebook";

  useEffect(() => {
    if (!FB_APP_ID) return;

    loadFacebookSdk()
      .then(() => {
        setSdkReady(true);
      })
      .catch((err) => {
          console.error("Facebook SDK load error:", err);
          toast.error("Facebook Sign-In could not be loaded.");
      });
  }, []);

  const handleFacebookLogin = useCallback(() => {
    if (loading || disabled || !sdkReady || !window.FB) return;

    window.FB.login((response) => {
      const processLogin = async () => {
        if (response.authResponse) {
          try {
            setLoading(true);
            const accessToken = response.authResponse.accessToken;

            let locationData = null;
            try {
              locationData = await getPreciseLocation();
            } catch (_) {
              /* optional */
            }

            const payload = { accessToken };
            if (locationData) {
              payload.latitude = locationData.latitude;
              payload.longitude = locationData.longitude;
              payload.location_accuracy = locationData.accuracy;
            }

            const res = await apiCall(endpoint, "POST", payload);
            const json = await res.json().catch(() => ({}));

            if (!res.ok) throw new Error(json.message || "Facebook authentication failed.");

            const token = json.data?.token || json.token;
            if (!token) throw new Error("Facebook authentication did not return a login token.");

            toast.success(mode === "signup" ? "Signup successful 🎉" : "Login successful 🎉");
            await onAuthenticated(token);
          } catch (err) {
            toast.error(err.message || "Facebook authentication failed.");
          } finally {
            setLoading(false);
          }
        } else {
          toast.error("User cancelled login or did not fully authorize.");
        }
      };
      processLogin();
    }, { scope: 'public_profile,email' });
  }, [loading, disabled, sdkReady, mode, onAuthenticated]);

  if (!FB_APP_ID) {
    return (
      <button
        type="button"
        disabled
        style={{
          ...buttonBaseStyle,
          color: "#9ca3af",
          cursor: "not-allowed",
          opacity: 0.6,
        }}
      >
        <FaFacebook size={20} color="#1877F2" />
        Continue with Facebook
      </button>
    );
  }

  const isDisabled = !sdkReady || loading || disabled;

  return (
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

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </button>
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
