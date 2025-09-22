
"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

type AdSlotProps = {
  slot: string;
  layout?: "in-article" | "fluid" | "display";
  className?: string;
  minHeight?: number;
};

declare global {
  interface Window { adsbygoogle: any[] }
}

export function AdSlot({
  slot,
  layout = "display",
  className,
  minHeight = 280,
}: AdSlotProps) {

  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (_) {}
  }, [slot, layout]);

  const baseAttrs: Record<string, string> = {
    class: "adsbygoogle",
    "data-ad-client": "ca-pub-5118101506692087",
    "data-ad-slot": slot,
  };

  const layoutAttrs =
    layout === "in-article"
      ? { "data-ad-format": "fluid", "data-ad-layout": "in-article" }
      : layout === "fluid"
      ? { "data-ad-format": "fluid" }
      : { "data-ad-format": "auto", "data-full-width-responsive": "true" };

  return (
    <div className={cn("flex justify-center", className)} style={{ minHeight, display: "block" }}>
      {/* @ts-expect-error data-attrs dinámicos */}
      <ins {...baseAttrs} {...layoutAttrs} style={{ display: "block" }} />
    </div>
  );
}

export default AdSlot;
