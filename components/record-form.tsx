"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiConfig, DailyRecord, ApiCost } from "@/lib/types";

interface RecordFormProps {
  apis: ApiConfig[];
  onSave: (record: DailyRecord) => void;
  onClose?: () => void;
  editingRecord?: DailyRecord;
}

export function RecordForm({ apis, onSave, onClose, editingRecord }: RecordFormProps) {
  const [date, setDate] = useState(
    editingRecord?.date || new Date().toISOString().split("T")[0]
  );
  const [apiCosts, setApiCosts] = useState<ApiCost[]>(
    editingRecord?.apiCosts || apis.map((api) => ({ apiId: api.id, cost: 0 }))
  );
  const [imageCount, setImageCount] = useState(editingRecord?.imageCount || 0);
  const [notes, setNotes] = useState(editingRecord?.notes || "");

  const handleApiCostChange = (apiId: string, value: string) => {
    const cost = parseFloat(value) || 0;
    setApiCosts((prev) => {
      const existing = prev.find((ac) => ac.apiId === apiId);
      if (existing) {
        return prev.map((ac) => (ac.apiId === apiId ? { ...ac, cost } : ac));
      }
      return [...prev, { apiId, cost }];
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const totalCost = apiCosts.reduce((sum, ac) => sum + ac.cost, 0);

    const record: DailyRecord = {
      id: editingRecord?.id || `${date}-${Date.now()}`,
      date,
      apiCosts: apiCosts.filter((ac) => ac.cost > 0),
      imageCount,
      totalCost,
      notes: notes.trim() || undefined,
    };

    onSave(record);

    // 重置表单
    if (!editingRecord) {
      setDate(new Date().toISOString().split("T")[0]);
      setApiCosts(apis.map((api) => ({ apiId: api.id, cost: 0 })));
      setImageCount(0);
      setNotes("");
    }

    // 关闭对话框
    if (onClose) {
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
          {/* 日期选择 */}
          <div className="space-y-2">
            <Label htmlFor="date">日期</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* API费用输入 */}
          <div className="space-y-3">
            <Label>API费用（元）</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {apis.map((api) => {
                const apiCost = apiCosts.find((ac) => ac.apiId === api.id);
                return (
                  <div key={api.id} className="space-y-1">
                    <Label htmlFor={`api-${api.id}`} className="text-sm text-muted-foreground">
                      {api.name}
                    </Label>
                    <Input
                      id={`api-${api.id}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={apiCost?.cost || 0}
                      onChange={(e) => handleApiCostChange(api.id, e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* 图片数量 */}
          <div className="space-y-2">
            <Label htmlFor="imageCount">生成图片总数</Label>
            <Input
              id="imageCount"
              type="number"
              min="0"
              value={imageCount}
              onChange={(e) => setImageCount(parseInt(e.target.value) || 0)}
              placeholder="0"
            />
          </div>

          {/* 备注 */}
          <div className="space-y-2">
            <Label htmlFor="notes">备注（可选）</Label>
            <Input
              id="notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="添加备注信息..."
            />
          </div>

      {/* 提交按钮 */}
      <Button type="submit" className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        {editingRecord ? "更新记录" : "添加记录"}
      </Button>
    </form>
  );
}
