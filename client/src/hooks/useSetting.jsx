import { useState, useEffect } from "react";

export function useSettings() {
  const [offset, setOffset] = useState(() => {
    const savedOffset = localStorage.getItem("offset");
    return savedOffset !== null ? parseInt(savedOffset, 10) : 5;
  });

  const [soundBool, setSoundBool] = useState(() => {
    const savedSound = localStorage.getItem("sound");
    return savedSound !== null ? JSON.parse(savedSound) : true;
  });

  const [blackDotEffect, setBlackDotEffect] = useState(() => {
    const savedDotEffectState = localStorage.getItem("blackDotEffect");
    return savedDotEffectState ? JSON.parse(savedDotEffectState) : false;
  });

  const [maxTopNodes, setMaxTopNodes] = useState(() => {
    const saved = localStorage.getItem("maxTopNodes");
    return saved !== null ? parseInt(saved, 10) : 10;
  });

  const [maxBottomNodes, setMaxBottomNodes] = useState(() => {
    const saved = localStorage.getItem("maxBottomNodes");
    return saved !== null ? parseInt(saved, 10) : 10;
  });

  const [lightMode, setLightMode] = useState(() => {
    const savedLightMode = localStorage.getItem("lightMode");
    return savedLightMode ? JSON.parse(savedLightMode) : true;
  });

  useEffect(() => {
    localStorage.setItem("sound", soundBool);
  }, [soundBool]);

  useEffect(() => {
    localStorage.setItem("blackDotEffect", JSON.stringify(blackDotEffect));
  }, [blackDotEffect]);

  useEffect(() => {
    localStorage.setItem("maxTopNodes", maxTopNodes);
  }, [maxTopNodes]);

  useEffect(() => {
    localStorage.setItem("maxBottomNodes", maxBottomNodes);
  }, [maxBottomNodes]);

  useEffect(() => {
    localStorage.setItem("lightMode", JSON.stringify(lightMode));
  }, [lightMode]);

  return {
    offset,
    setOffset,
    soundBool,
    setSoundBool,
    blackDotEffect,
    setBlackDotEffect,
    lightMode,
    setLightMode,
    maxTopNodes,
    setMaxTopNodes,
    maxBottomNodes,
    setMaxBottomNodes,
  };
}
