// The canonical roster, titles, and biographies for the firm.
//
// One source of truth on purpose: /management-bios and the team section of the
// note offering page both read from here, so a title can never say one thing on
// the corporate site and something else on the offering. Titles and bio text
// are reproduced from stagepointcapital.com, which is authoritative.

export type TeamMember = {
  slug: string;
  name: string;
  title: string;
  /** Short form used where a full title would not fit, e.g. the offering page grid. */
  shortTitle: string;
  photo?: string;
  /** CSS object-position for the photo crop. Defaults to "top" when omitted. */
  photoPosition?: string;
  bio: string[];
};

export const MANAGEMENT: TeamMember[] = [
  {
    slug: "whitney-quillen",
    name: "Whitney Quillen",
    title: "Chief Executive Officer & General Counsel",
    shortTitle: "Chief Executive Officer & General Counsel",
    photo: "/team/whitney-quillen.png",
    bio: [
      "Prior to joining SPC, Whitney Quillen was the founder and CEO of W. Quillen Securities, a Finra-Member investment bank, formed in 2001 and sold in March 2009.",
      "Prior to forming W. Quillen Securities, Whitney was affiliated with Quilcap Corp, initially as outside counsel, and from 2000 to 2002 as in-house counsel and equity analyst. Quilcap Corp. is a long-short, value-oriented hedge fund. From 1994 to 2000, Whitney ran his own law practice focusing on commercial litigation, distressed debt resolution, and securities regulation.",
      "He has also advised hedge funds on commercial litigation affecting publicly traded equity and has served as Chairman, legal counsel, and member of various creditors' committees in bankruptcy proceedings. Whitney is a member of the Bar of the State of New York. He obtained an MBA in Corporate Finance (with Honors) from Pace University's Lubin Graduate School of Business in 1997, a JD from New York Law School in 1994, and a BA in Political Economics from Skidmore College in 1989.",
    ],
  },
  {
    slug: "sanjeev-khurana",
    name: "Sanjeev Khurana",
    title: "Managing Principal & Head of Stage Point Alternatives",
    shortTitle: "Managing Principal, Stage Point Alternatives",
    photo: "/team/sanjeev-khurana.png",
    bio: [
      "Sanjeev joined Stage Point Capital (SPC) in 2020, where he leads Stage Point Alternatives (SPA), an investment services business of SPC and actively involved in the capital markets related activities for Stage Point Fund. In addition, he is an investor in, and a strategic advisor to several specialty finance companies. He brings established relationships with global sponsors, issuers, investment banks and other service providers in the areas of specialty finance, private credit, and structured finance. Previously, he spent 25+ years at major financial firms including Oppenheimer & Co., Bear Stearns Asset Management, UBS Dillon Read Capital Management, and JP Morgan in the areas of portfolio management, investment banking and institutional sales.",
      "Sanjeev holds an MBA from the Stern School of Business, New York University, an MS in Computer Information Systems from The City University of New York, and a BA (Honors) in Mathematical Statistics from the University of Delhi, India.",
    ],
  },
  {
    slug: "clayton-rice",
    name: "Clayton Rice",
    title: "Vice President & Head of Origination",
    shortTitle: "Vice President & Head of Origination",
    photo: "/team/clayton-rice.png",
    // The source is nearly square and his chin sits close to its bottom edge, so
    // anchoring the crop to the bottom shows as much of the lower photo (and as
    // little of the top) as a square tile can.
    photoPosition: "center bottom",
    bio: [
      "Prior to joining Stage Point Capital, Clayton Rice was an analyst and operations manager at Human Resolution Technologies, LLC (HRT). His duties included accounting, account management, supporting capital allocation decisions, and developing internal healthcare management systems focused on driving company efficiency.",
      "Prior to joining HRT, Clayton was a summer associate and financial assistant to Managing Partner at Meads Bay Capital, a BioTech hedge fund where he analyzed IPO's, attended roadshow presentations and met management teams.",
      "Clayton earned a BS in Psychology at the University of St Andrews in 2019, where he captained the Men's Squash team.",
    ],
  },
  {
    slug: "michael-shore",
    name: "Michael Shore",
    title: "Finance & Operations Manager, Stage Point Fund | Principal, Stage Point Alternatives",
    shortTitle: "Finance & Operations Manager, Stage Point Fund",
    photo: "/team/michael-shore.jpg",
    bio: [
      "Michael joined Stage Point Fund in 2023 as the Finance & Operations Manager. He is also responsible for the operational management of the SMA portfolios of Stage Point Advisors. He brings to the firm a wealth of experience in fund operations, structured finance, capital markets and alternative investments through his career in both asset management and investment banking.",
      "Previously, Michael was an Executive Director at a New York based specialty finance company and SEC Registered Investment Adviser where he led the firm's strategic projects initiatives, including among other things, the development and ongoing management of structured investment vehicles offering sophisticated investors the opportunity to invest in diversified trade finance portfolios. Michael also spent 12 years as an Executive Director of MS Global Finance, a boutique investment bank and advisory firm where he was responsible for the origination, credit analysis, structuring and private placement of structured finance and private credit transactions in the developing and emerging markets worldwide. Michael began his career at Emerging Markets Securities LLC, where he played an instrumental role in the structuring and ongoing management of multiple securitized trade finance funds (CLOs) valued at nearly $200 million.",
      "Michael holds a BS in Business Administration from the University of Colorado at Boulder where he also minored in Economics.",
    ],
  },
  {
    slug: "shavasp-quillen",
    name: "Shavasp Quillen",
    title: "Marketing Lead",
    shortTitle: "Marketing Lead",
    photo: "/team/shavasp-quillen.jpg",
    bio: [
      "Shavasp Quillen brings a multifaceted background in marketing, content creation, and business operations to his role as Marketing Lead at SPC. Prior to joining SPC, Shavasp founded Courtesy Attire, a premium activewear company. He also served as Paid Social Media Marketing Manager at Masterworks, where he achieved significant results in lead generation, brand building, and campaign optimization.",
      "Shavasp's experience extends beyond digital marketing. He previously held the position of producer at the North Fork TV Festival, where he managed all aspects of festival operations, including partnerships, budgeting, sales, and content curation.",
      "Shavasp holds a BSc (Honors) in Film and Literature from The University of Warwick and a MSc (First Class Honors) in Marketing from Queen Mary University London.",
    ],
  },
];

export type AdvisoryMember = {
  name: string;
  title: string;
  bio: string;
};

export const ADVISORY_BOARD: AdvisoryMember[] = [
  {
    name: "James D. Marver",
    title: "Co-Founder & Managing Director of Vantage Point Capital Partners",
    bio: "VantagePoint is a registered investment adviser with approximately $5 billion of private equity under management which saw the successful IPO or sale of dozens of its portfolio companies, including Tesla Motors (NASDAQ:TSLA, on the board of which Jim served). Jim is also Chairman Emeritus of the Board of Advisors, Goldman School of Public Policy at the University of California, Berkeley, and is a member of the Board of Directors of The National Venture Capital Association (NVCA). Jim attended Williams College (BA) and the University of California, Berkeley (MPP '74, PhD '78).",
  },
  {
    name: "Jarrett Lilien",
    title: "President & COO of Wisdom Tree Investments, Inc. (NASDAQ:WETF)",
    bio: "Jarrett is also Vice Chairman of Barton International. Prior to WisdomTree, Jarrett was interim CEO at Investment Technologies Group (NYSE:ITG), co-founder and CEO of TIR Securities, which eventually sold to E*TRADE where he became President and Chief Operating Officer. Previously, Jarrett founded Bendigo Partners, a private equity firm and adviser to some of the world's largest publicly-traded financial services companies.",
  },
  {
    name: "Joan Fleischmann Tobin",
    title: "Owner, Neapolitan Enterprises LLC",
    bio: "Based in Naples, FL. Neapolitan Enterprises is a property management company that owns and operates Third Street South, the birthplace of Old Naples and one of that city's largest owners of residential, retail and office properties.",
  },
];

/** Initials for the tile shown when a member has no photograph on file. */
export function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
}
