import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles/global.css";
import TitlePage from "./title_page.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <TitlePage />
  </StrictMode>
);
