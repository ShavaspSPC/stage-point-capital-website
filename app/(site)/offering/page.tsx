import type { Metadata } from "next";
import { CapitalStructure } from "../../components/CapitalStructure";
import { ClosingCTA } from "../../components/ClosingCTA";
import { Hero } from "../../components/Hero";
import { MarketOpportunity } from "../../components/MarketOpportunity";
import { NoteCalculator } from "../../components/NoteCalculator";
import { Offering } from "../../components/Offering";
import { Portfolio } from "../../components/Portfolio";
import { Protection } from "../../components/Protection";
import { Team } from "../../components/Team";
import { Terms } from "../../components/Terms";
import { TrackRecord } from "../../components/TrackRecord";
import { OfferingSubnav } from "../../components/site/OfferingSubnav";

export const metadata: Metadata = {
  title: "The Stage Point Master Note Offering",
  description:
    "Stage Point Master, LLC offers secured promissory notes yielding 6.00% to 10.00% annually across terms from 3 to 60 months, backed by a 12-year track record of zero principal loss and first-lien real estate collateral. For accredited and qualified investors.",
};

export default function InvestPage() {
  return (
    <>
      <OfferingSubnav />
      <Hero />
      <MarketOpportunity />
      <Offering />
      <NoteCalculator />
      <TrackRecord />
      <Protection />
      <Portfolio />
      <CapitalStructure />
      <Team />
      <Terms />
      <ClosingCTA />
    </>
  );
}
