import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MindSpace",
    short_name: "MindSpace",
    description: "Campus counselling, booking, and wellbeing in one calm place.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f8fb",
    theme_color: "#5d4eb7",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
