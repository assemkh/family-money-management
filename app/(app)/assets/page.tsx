import type { Metadata } from "next";
import { PortfolioPage } from "@/components/finance/portfolio-page";
export const metadata: Metadata = { title: "Assets" };
export default function AssetsPage() {
  return <PortfolioPage kind="assets" />;
}
