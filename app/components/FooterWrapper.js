"use client";

import dynamic from "next/dynamic";

const Footer = dynamic(() => import('./Footer'), { ssr: false });

export default function FooterWrapper() {
  return <Footer />;
}