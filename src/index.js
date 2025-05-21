import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "tailwindcss/tailwind.css";
import "./styles.css"; // Import custom styles

const root = createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
