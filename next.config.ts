import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // The live Squarespace site carries collision suffixes on two slugs that
      // mean nothing to a reader. The clean paths are canonical here; these
      // keep every existing inbound link and search result working.
      { source: "/stagepointfund-1", destination: "/stage-point-fund", permanent: true },
      { source: "/stagepointmaster-1", destination: "/stage-point-master", permanent: true },

      // Each management biography was its own page on the live site. They are
      // now sections of a single page, each with an anchor named for the slug,
      // so an old link lands on that person's section.
      { source: "/whitney-quillen", destination: "/management-bios#whitney-quillen", permanent: true },
      { source: "/sanjeev-khurana", destination: "/management-bios#sanjeev-khurana", permanent: true },
      { source: "/clayton-rice", destination: "/management-bios#clayton-rice", permanent: true },
      { source: "/michael-shore", destination: "/management-bios#michael-shore", permanent: true },
      { source: "/shavasp-quillen", destination: "/management-bios#shavasp-quillen", permanent: true },
      // James Morgan is no longer with the firm's published roster. The old bio
      // URL still redirects to the team page so inbound links land somewhere
      // sensible rather than on a 404.
      { source: "/james-morgan", destination: "/management-bios", permanent: true },

      // The rest of the Squarespace site's public URLs (its sitemap lists them),
      // so nothing that is linked or indexed becomes a 404 when the domain
      // moves here.
      { source: "/home", destination: "/", permanent: true },
      // Both are the note-offering pitch, which is now the /invest page.
      { source: "/value-proposition", destination: "/invest", permanent: true },
      { source: "/landing-page", destination: "/invest", permanent: true },
      { source: "/apply-for-access", destination: "/request-access", permanent: true },
      // Scheduling lives on the contact page.
      { source: "/calendly", destination: "/contact", permanent: true },
      // Near-empty shells on the old site (a member-area placeholder).
      { source: "/member-site-homepage-2", destination: "/", permanent: true },
      { source: "/member-site-homepage-2-1", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
