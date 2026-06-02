"use client";

import { useEffect } from "react";
import { scan } from "react-scan";

export function ReactScanInit() {
  useEffect(() => {
    scan({
      enabled: true,
    });
  }, []);

  return null;
}
