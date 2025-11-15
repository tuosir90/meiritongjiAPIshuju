import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',  // 静态导出，支持GitHub Pages部署
  images: {
    unoptimized: true,  // GitHub Pages不支持Next.js图片优化
  },
  // GitHub Pages子路径配置
  basePath: '/meiritongjiAPIshuju',
};

export default nextConfig;
