const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildDataPath,
  calculateRawAmount,
  sumQuota,
} = require('./zikl-dashboard-runner.js');

test('buildDataPath uses the observed data dashboard query parameters', () => {
  assert.equal(
    buildDataPath({ startTimestamp: 1786118400, endTimestamp: 1786204800 }),
    '/api/data/self?start_timestamp=1786118400&end_timestamp=1786204800&default_time=hour',
  );
});

test('calculateRawAmount converts API quota using quota_per_unit', () => {
  const records = [{ quota: 5000 }, { quota: '5000' }, { quota: null }];

  assert.equal(sumQuota(records), 10000);
  assert.equal(calculateRawAmount(records, 500000), 0.02);
});

test('calculateRawAmount rejects an invalid quota_per_unit', () => {
  assert.throws(() => calculateRawAmount([], 0), /quota_per_unit/);
});
