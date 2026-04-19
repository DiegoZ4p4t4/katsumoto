import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    const main = document.querySelector("main.overflow-auto");
    if (main) main.scrollTop = 0;
  }, [pathname]);

  return null;
}
