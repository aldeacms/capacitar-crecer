import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Aumentar límite de tamaño de servidor para archivos grandes en lecciones
  serverRuntimeConfig: {
    maxRequestSize: "50mb",
  },
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};

export default nextConfig;
