import { AppData, DailyRecord } from "./types";

/**
 * 生成测试数据
 */
export function generateTestData(): AppData {
  const apis = [
    { id: "volcengine", name: "火山引擎（字节跳动）", color: "#0052D9" },
    { id: "yunwu", name: "云雾API", color: "#00b96b" },
    { id: "tangguo", name: "糖果姐姐API", color: "#ff5c93" },
  ];

  const records: DailyRecord[] = [];
  const today = new Date();

  // 生成过去30天的数据
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    // 总费用目标：50-60元
    const targetTotal = 50 + Math.random() * 10;
    const ratio1 = 0.3 + Math.random() * 0.1;
    const ratio2 = 0.25 + Math.random() * 0.1;
    const ratio3 = 1 - ratio1 - ratio2;
    const volcengineCost = targetTotal * ratio1;
    const yunwuCost = targetTotal * ratio2;
    const tangguoCost = targetTotal * ratio3;

    // 随机生成图片数量：1000-1500张
    const imageCount = Math.floor(Math.random() * 501) + 1000;

    const totalCost = volcengineCost + yunwuCost + tangguoCost;

    records.push({
      id: `${dateStr}-${Date.now()}-${i}`,
      date: dateStr,
      apiCosts: [
        { apiId: "volcengine", cost: Math.round(volcengineCost * 100) / 100 },
        { apiId: "yunwu", cost: Math.round(yunwuCost * 100) / 100 },
        { apiId: "tangguo", cost: Math.round(tangguoCost * 100) / 100 },
      ],
      imageCount,
      totalCost: Math.round(totalCost * 100) / 100,
      notes: i % 5 === 0 ? `测试数据 - 第${30 - i}天` : undefined,
    });
  }

  return {
    apis,
    records,
  };
}

/**
 * 在浏览器中生成并保存测试数据
 */
export function loadTestDataToBrowser() {
  if (typeof window === "undefined") {
    console.error("此函数只能在浏览器中运行");
    return;
  }

  const testData = generateTestData();
  localStorage.setItem("api-cost-tracker-data-v2", JSON.stringify(testData));
  console.log("✅ 测试数据已生成！共", testData.records.length, "条记录");
  console.log("📊 请刷新页面查看效果");

  // 自动刷新页面
  window.location.reload();
}
