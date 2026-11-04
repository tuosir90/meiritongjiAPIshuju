const assert = require('node:assert/strict');
const test = require('node:test');

const { CONFIG, formatDateInfo } = require('../manxiaobai-crawler/manxiaobai-crawler.js');
const {
  describeManxiaobaiAmount,
  formatManxiaobaiAmount,
  parseTargetDate,
} = require('../manxiaobai-crawler/run-manxiaobai.js');

test('formatManxiaobaiAmount applies the 1.1 multiplier', () => {
  assert.equal(formatManxiaobaiAmount('10'), '11.00');
  assert.equal(formatManxiaobaiAmount(6.5), '7.15');
  assert.equal(formatManxiaobaiAmount(null), '0.00');
  assert.equal(
    describeManxiaobaiAmount('6.5', '7.15'),
    '原始金额: 6.5, 倍率: 1.1, 写入值: 7.15',
  );
});

test('uses the ZIKL-style dashboard address and a full local calendar day', () => {
  const dateInfo = formatDateInfo(new Date(2026, 7, 20, 16, 30));

  assert.equal(CONFIG.url, 'https://api.manxiaobai.online/dashboard/overview');
  assert.equal(dateInfo.formatted, '2026/8/20');
  assert.equal(dateInfo.startTime, '2026-08-20 00:00:00');
  assert.equal(dateInfo.endTime, '2026-08-21 00:00:00');
  assert.equal(dateInfo.endTimestamp - dateInfo.startTimestamp, 86400);
});

test('parseTargetDate rejects impossible dates', () => {
  assert.throws(() => parseTargetDate('2026-02-30'), /实际存在的日期/);
  assert.equal(parseTargetDate('2026-08-20').getDate(), 20);
});
