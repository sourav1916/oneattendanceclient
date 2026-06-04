// utils/layerPayment.js

import { toast } from "react-toastify";

const ACCESS_KEY = "164d87e7-f365-4a8a-9e03-976ea49560e7";

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
          logo: "/logo.png",
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