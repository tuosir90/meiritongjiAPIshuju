const assert = require('node:assert/strict');
const test = require('node:test');

const {
  extractAmountFromCandidateText,
  pickAmountFromCandidates,
} = require('../scripts/cost-amount-extractor.js');

test('应从统计额度后一行的金额中提取正确数值', () => {
  const text = [
    '当前余额',
    '¥34.83',
    '¥1745.37',
    '资源消耗',
    '统计额度',
    '¥4.73',
  ].join('\n');

  assert.equal(extractAmountFromCandidateText(text), '4.73');
});

test('应跳过空候选文本并从后续候选文本中提取金额', () => {
  const amount = pickAmountFromCandidates([
    '统计额度',
    '',
    '资源消耗\n统计额度\n¥4.73',
  ]);

  assert.equal(amount, '4.73');
});

test('应支持提取零额度', () => {
  const text = '资源消耗\n统计额度\n¥0.00\n统计Tokens87,452';

  assert.equal(extractAmountFromCandidateText(text), '0.00');
});
