"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

// In a real application, this would use exact types from the JSON schema
interface BlockConfig {
  id: string;
  type: string;
  variant: string;
  data: any;
}

interface GlobalContext {
  theme?: any;
  brandName?: string;
  globalData?: any;
}

// Map the string types from JSON to our Next.js dynamic imports
// Note: using relative paths to the components we just created
const BlockRegistry: Record<string, Record<string, React.ComponentType<any>>> = {
  hero: {
    "cinematic": dynamic(() => import("./Hero")),
    // Fallback if the requested variant is not yet implemented
    "default": dynamic(() => import("./Hero")),
  },
  about: {
    "story": dynamic(() => import("./About")),
    "default": dynamic(() => import("./About")),
  },
  menu: {
    "bento-grid": dynamic(() => import("./Menu")),
    "classic": dynamic(() => import("./Menu")),
    "default": dynamic(() => import("./Menu")),
  },
  gallery: {
    "masonry": dynamic(() => import("./Gallery")),
    "default": dynamic(() => import("./Gallery")),
  },
  testimonials: {
    "social-proof": dynamic(() => import("./Testimonials")),
    "default": dynamic(() => import("./Testimonials")),
  },
  contact: {
    "reservation-cta": dynamic(() => import("./ReservationCTA")),
    "default": dynamic(() => import("./ReservationCTA")),
  }
};

export default function BlockResolver({ 
  block, 
  context 
}: { 
  block: BlockConfig; 
  context?: GlobalContext;
}) {
  const variantMap = BlockRegistry[block.type];
  
  if (!variantMap) {
    console.warn(`Block type "${block.type}" not found in BlockRegistry.`);
    return null; 
  }

  // Fallback to "default" or the first available variant if hallucinated
  const Component = variantMap[block.variant] || variantMap["default"] || variantMap[Object.keys(variantMap)[0]];

  return (
    <section id={block.id} className="relative w-full block-resolver-wrapper">
      <Suspense fallback={<div className="w-full h-32 animate-pulse bg-white/5" />}>
        {/* We pass the parsed data down to the underlying component */}
        <Component data={block.data} context={context} />
      </Suspense>
    </section>
  );
}
