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
      // now anchors on a single page, so the old URLs point at it.
      { source: "/whitney-quillen", destination: "/management-bios", permanent: true },
      { source: "/sanjeev-khurana", destination: "/management-bios", permanent: true },
      { source: "/clayton-rice", destination: "/management-bios", permanent: true },
      { source: "/michael-shore", destination: "/management-bios", permanent: true },
      { source: "/shavasp-quillen", destination: "/management-bios", permanent: true },
      // James Morgan is no longer with the firm's published roster. The old bio
      // URL still redirects to the team page so inbound links land somewhere
      // sensible rather than on a 404.
      { source: "/james-morgan", destination: "/management-bios", permanent: true },
    ];
  },
};

export default nextConfig;
