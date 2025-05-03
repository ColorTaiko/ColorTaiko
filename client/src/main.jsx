import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles/global.css";
import TitlePage from "./title_page.jsx";
import { useState, useRef, useEffect } from "react";

function Root() {
  const [level, setLevel] = useState(null);

  // until a level is chosen, show TitlePage; once chosen, swap to App
  return level ? <App level={level} /> : <TitlePage onLevelSelect={setLevel} />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Root />
  </StrictMode>
);

//need to pass level as: Level 1, Level 2...
