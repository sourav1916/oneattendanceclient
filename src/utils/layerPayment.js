// utils/layerPayment.js

import { toast } from "react-toastify";

const ACCESS_KEY = process.env.REACT_APP_LAYER_ACCESS_KEY;

export const initiateLayerPayment = (
  paymentToken,
  navigate
) => {
  return new Promise((resolve, reject) => {
    if (!window.Layer) {
      reject(new Error("Layer SDK not loaded"));
      return;
    }

    window.Layer.checkout(
      {
        token: paymentToken,
        accesskey: ACCESS_KEY,
        theme: {
          logo: "/favicon.svg",
          color: "#4F46E5",
          error_color: "#EF4444",
        },
      },

      (response) => {
        console.log("Layer Response:", response);

        switch (response.status) {
          case "captured":
            toast.success("Payment successful");

            navigate("/home");

            resolve(response);
            break;

          case "created":
            toast.info("Payment created");
            break;

          case "pending":
            toast.warning("Payment pending");

            navigate("/subscription");

            resolve(response);
            break;

          case "failed":
            toast.error("Payment failed");

            navigate("/subscription");

            reject(response);
            break;

          case "cancelled":
            toast.info("Payment cancelled");

            navigate("/subscription");

            reject(response);
            break;

          default:
            toast.error("Unknown payment status");
            reject(response);
        }
      },

      (err) => {
        console.error(err);

        toast.error("Payment initialization failed");

        reject(err);
      }
    );
  });
};