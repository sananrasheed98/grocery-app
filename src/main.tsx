import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);

if ("serviceWorker" in navigator && !location.hostname.includes("localhost")) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}
