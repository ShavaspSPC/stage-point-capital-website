// The site's information architecture, in one place so the header, the footer,
// and the mobile drawer can never disagree about what the site contains.
//
// Slugs mirror the live Squarespace site so inbound links and search rankings
// survive the rebuild. Two exceptions are deliberate: "stagepointfund-1" and
// "stagepointmaster-1" carried a Squarespace collision suffix that means
// nothing to a reader, so they become clean slugs and the old paths redirect
// (see next.config.ts).

export type NavChild = { href: string; label: string; blurb: string };
export type NavItem = { href: string; label: string; children?: NavChild[] };

export const NAV_ITEMS: NavItem[] = [
  { href: "/about", label: "About" },
  {
    href: "/our-investment-vehicles",
    label: "Vehicles",
    children: [
      {
        href: "/our-investment-vehicles",
        label: "Our Investment Vehicles",
        blurb: "How SPF and SPM fit together.",
      },
      {
        href: "/stage-point-fund",
        label: "Stage Point Fund",
        blurb: "The lender that originates and holds the loans.",
      },
      {
        href: "/stage-point-master",
        label: "Stage Point Master",
        blurb: "The feeder investors lend to.",
      },
    ],
  },
  {
    href: "/leadership",
    label: "Team",
    children: [
      { href: "/leadership", label: "Leadership", blurb: "Experience and track record." },
      { href: "/management-bios", label: "Management Bios", blurb: "The people running the firm." },
      { href: "/advisory-board", label: "Advisory Board", blurb: "Who advises the firm." },
    ],
  },
  {
    href: "/contact",
    label: "Contact",
    children: [
      { href: "/contact", label: "Contact", blurb: "Reach the New York office." },
      {
        href: "/borrower-loan-intake-form",
        label: "Borrower Loan Intake Form",
        blurb: "For investors seeking a fix and flip loan.",
      },
    ],
  },
];

// The note offering lives outside NAV_ITEMS because it is the conversion path,
// not a peer of the informational pages. It gets the header's one button.
export const INVEST_HREF = "/invest";
export const INVEST_LABEL = "Invest";

export const OFFICE = {
  street: "12 East 49th St. #1808",
  city: "New York, NY 10017",
  phone: "(401) 227-5775",
  phoneHref: "tel:+14012275775",
  hours: "Monday to Friday, 10am to 6pm",
  linkedIn: "https://www.linkedin.com/company/stage-point-capital",
};
