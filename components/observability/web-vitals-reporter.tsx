"use client";

import { useReportWebVitals } from "next/web-vitals";

type WebVitalMetric = Parameters<Parameters<typeof useReportWebVitals>[0]>[0];

type DeviceClass = "phone" | "tablet" | "desktop";

export type FamilyMoneyWebVital = {
  delta: number;
  deviceClass: DeviceClass;
  id: string;
  locale: string;
  name: string;
  navigationType: string;
  rating: string;
  route: string;
  theme: "dark" | "light";
  value: number;
};

declare global {
  interface Window {
    __FAMILY_MONEY_WEB_VITALS__?: FamilyMoneyWebVital[];
  }
}

function deviceClass(width: number): DeviceClass {
  if (width < 768) return "phone";
  if (width < 1200) return "tablet";
  return "desktop";
}

function allowedPayload(metric: WebVitalMetric): FamilyMoneyWebVital {
  // Authenticated locale is applied by the household layout because the root
  // document cannot know it before authentication. Prefer that nearest locale
  // boundary over the public document default.
  const routeLocale = document
    .querySelector("main")
    ?.closest("[lang]")
    ?.getAttribute("lang");

  return {
    delta: metric.delta,
    deviceClass: deviceClass(window.innerWidth),
    id: metric.id,
    locale: routeLocale || document.documentElement.lang || "unknown",
    name: metric.name,
    navigationType: metric.navigationType,
    rating: metric.rating,
    // Search parameters may contain selected members or dates, so only the
    // pathname is retained. Financial values and profile data are never read.
    route: window.location.pathname,
    theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
    value: metric.value,
  };
}

const reportMetric = (metric: WebVitalMetric) => {
  const payload = allowedPayload(metric);
  window.__FAMILY_MONEY_WEB_VITALS__ ??= [];
  window.__FAMILY_MONEY_WEB_VITALS__.push(payload);
  window.dispatchEvent(new CustomEvent("family-money:web-vital", { detail: payload }));

  const endpoint = process.env.NEXT_PUBLIC_WEB_VITALS_ENDPOINT;
  if (!endpoint) return;

  const body = JSON.stringify(payload);
  if (navigator.sendBeacon) {
    navigator.sendBeacon(endpoint, new Blob([body], { type: "application/json" }));
    return;
  }

  void fetch(endpoint, {
    body,
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    method: "POST",
  });
};

export function WebVitalsReporter() {
  // Keeping this callback at module scope prevents duplicate metric delivery.
  useReportWebVitals(reportMetric);
  return null;
}
