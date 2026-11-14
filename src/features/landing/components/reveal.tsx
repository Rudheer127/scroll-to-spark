"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

type RevealProps = { children: React.ReactNode; className?: string; delay?: number };

/**
 * Fades and lifts its children in when they scroll into view.
 * The content is visible on the server and without JavaScript. It is only hidden after mount, and only
 * when it starts below the fold, so nobody sees a flash.
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (node.getBoundingClientRect().top < window.innerHeight * 0.9) return;

    node.dataset.state = "hidden";
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        node.dataset.state = "visible";
        observer.disconnect();
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const style = { "--delay": `${delay}ms` } as React.CSSProperties;
  return (
    <div ref={ref} style={style} className={cn("landing-reveal", className)}>
      {children}
    </div>
  );
}
