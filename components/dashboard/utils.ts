import { DateFilter } from "@/components/date-filter/types";
import { DailyRecord } from "@/lib/types";

export function filterRecordsByDate(records: DailyRecord[], filter: DateFilter): DailyRecord[] {
  if (!filter.startDate || !filter.endDate) {
    return records;
  }

  const startDate = new Date(filter.startDate);
  const endDate = new Date(filter.endDate);

  return records.filter((record) => {
    const recordDate = new Date(record.date);
    return recordDate >= startDate && recordDate <= endDate;
  });
}
