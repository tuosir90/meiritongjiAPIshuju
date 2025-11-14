import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',  // 静态导出，支持GitHub Pages部署
  images: {
    unoptimized: true,  // GitHub Pages不支持Next.js图片优化
  },
  // 如果部署到GitHub Pages的子路径，需要设置basePath
  // basePath: '/api-cost-tracker',
};

export default nextConfig;
