const assert = require('node:assert/strict');
const test = require('node:test');

const { CONFIG, formatDateInfo } = require('./zikl-crawler.js');
const { describeZiklAmount, formatZiklAmount, parseTargetDate } = require('./run-zikl.js');

test('formatZiklAmount writes the raw dashboard amount with a multiplier of 1', () => {
  assert.equal(formatZiklAmount('10'), '10.00');
  assert.equal(formatZiklAmount(12.345), '12.35');
  assert.equal(formatZiklAmount(null), '0.00');
  assert.equal(describeZiklAmount('10', '10.00'), '原始金额: 10, 倍率: 1, 写入值: 10.00');
});

test('uses the data dashboard address and a full local calendar day', () => {
  const dateInfo = formatDateInfo(new Date(2026, 7, 8, 16, 30));

  assert.equal(CONFIG.url, 'https://img.mzfe.de/dashboard/overview');
  assert.equal(dateInfo.formatted, '2026/8/8');
  assert.equal(dateInfo.startTime, '2026-08-08 00:00:00');
  assert.equal(dateInfo.endTime, '2026-08-09 00:00:00');
  assert.equal(dateInfo.endTimestamp - dateInfo.startTimestamp, 86400);
});

test('parseTargetDate rejects impossible dates', () => {
  assert.throws(() => parseTargetDate('2026-02-30'), /实际存在的日期/);
  assert.equal(parseTargetDate('2026-08-08').getDate(), 8);
});
