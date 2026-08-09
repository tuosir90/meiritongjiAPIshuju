/**
 * 控制台统计额度提取工具
 */

function normalizeAmount(rawAmount) {
  return rawAmount ? rawAmount.replaceAll(',', '') : rawAmount;
}

function extractAmountFromCandidateText(rawText) {
  if (!rawText) return null;

  const text = String(rawText).replace(/\r/g, '');
  const labelMatch = text.match(/统计额度|Statistical\s*quota/i);
  const labelIndex = labelMatch?.index ?? -1;
  if (labelIndex === -1) return null;

  const snippet = text.slice(labelIndex, labelIndex + 120);
  const match = snippet.match(/(?:统计额度|Statistical\s*quota)[\s\S]{0,60}?[¥$]?\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?)/i);
  if (!match) return null;

  return normalizeAmount(match[1]);
}

function pickAmountFromCandidates(candidates) {
  for (const candidate of candidates) {
    const amount = extractAmountFromCandidateText(candidate);
    if (amount !== null) {
      return amount;
    }
  }

  return null;
}

module.exports = {
  extractAmountFromCandidateText,
  pickAmountFromCandidates,
};
