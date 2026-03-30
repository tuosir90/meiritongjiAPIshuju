import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WeeklySummary } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface WeeklySummaryTableProps {
  summaries: WeeklySummary[];
}

function getTopApi(summary: WeeklySummary) {
  return summary.apiBreakdown.slice().sort((a, b) => b.totalCost - a.totalCost)[0];
}

export function WeeklySummaryTable({ summaries }: WeeklySummaryTableProps) {
  if (summaries.length === 0) {
    return (
      <Card className="border-white/60 bg-white/82 shadow-lg shadow-emerald-100/50 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:shadow-none">
        <CardHeader>
          <CardTitle className="text-slate-950 dark:text-white">周明细列表</CardTitle>
          <CardDescription>当前还没有周汇总可展示。</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-white/60 bg-white/82 shadow-lg shadow-emerald-100/50 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:shadow-none">
      <CardHeader>
        <CardTitle className="text-slate-950 dark:text-white">周明细列表</CardTitle>
        <CardDescription>
          每周一到周日为一个汇总单元，表格中额外展示主导 API，方便直接定位异常周。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-2xl border border-slate-200/70 dark:border-white/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>周范围</TableHead>
                <TableHead>记录天数</TableHead>
                <TableHead>周总费用</TableHead>
                <TableHead>周图片数</TableHead>
                <TableHead>日均费用</TableHead>
                <TableHead>单日峰值</TableHead>
                <TableHead>主导 API</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaries.map((summary) => {
                const topApi = getTopApi(summary);
                return (
                  <TableRow key={summary.weekKey}>
                    <TableCell>
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {summary.weekLabel}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {summary.startDate} 至 {summary.endDate}
                      </div>
                    </TableCell>
                    <TableCell>{summary.recordCount}</TableCell>
                    <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(summary.totalCost)}
                    </TableCell>
                    <TableCell>{summary.totalImages.toLocaleString()}</TableCell>
                    <TableCell>{formatCurrency(summary.averageDailyCost)}</TableCell>
                    <TableCell>{formatCurrency(summary.maxDailyCost)}</TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {topApi?.apiName || "暂无"}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {topApi ? formatCurrency(topApi.totalCost) : formatCurrency(0)}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
