import type { Metadata } from "next";
import { PortfolioPage } from "@/components/finance/portfolio-page";
export const metadata: Metadata = { title: "Investments" };
export default function InvestmentsPage() {
  return <PortfolioPage kind="investments" />;
}
