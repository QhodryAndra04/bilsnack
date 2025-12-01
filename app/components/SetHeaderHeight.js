"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function SetHeaderHeight() {
  const pathname = usePathname();

  useEffect(() => {
    // Pages where header is intentionally hidden
    const hideHeader =
      pathname &&
      (pathname.startsWith("/admin") ||
        pathname.startsWith("/reseller") ||
        pathname.startsWith("/perloginan"));

    const headerHeight = hideHeader ? "0px" : "5rem"; // 5rem matches pt-20
    try {
      document.body.style.setProperty("--header-height", headerHeight);
      // Also set html just in case (SSR initial fallback)
      document.documentElement.style.setProperty("--header-height", headerHeight);
    } catch (err) {
      /* ignore */
    }
  }, [pathname]);

  return null;
}
