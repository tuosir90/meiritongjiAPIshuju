"use client";

export function DashboardFooter() {
  return (
    <footer className="border-t mt-12 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
        <p>API费用统计系统 ? {new Date().getFullYear()} · 数据存储在本地浏览器</p>
      </div>
    </footer>
  );
}
