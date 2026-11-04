const assert = require('node:assert/strict');
const test = require('node:test');
const { summarizeUsage } = require('./openlux-runner');

const valid = { statusHttp: 200, statusSuccess: true, quotaPerUnit: 500000,
  dataHttp: 200, dataSuccess: true, quotas: [10000, 4020] };

test('OpenLux quota converts to raw consumption and the existing eightfold cost', () => {
  assert.deepEqual(summarizeUsage(valid), {
    records: 2, quota: 14020, quotaPerUnit: 500000, raw: 0.02804, amount: '0.22',
  });
});

test('only a successful, valid empty response permits zero consumption', () => {
  assert.equal(summarizeUsage({ ...valid, quotas: [] }).amount, '0.00');
  for (const invalid of [
    { dataHttp: 401 }, { dataSuccess: false }, { statusHttp: 500 },
    { statusSuccess: false }, { quotaPerUnit: 0 }, { quotas: null },
    { quotas: [undefined] }, { quotas: [-1] }, { quotas: ['not-a-number'] },
  ]) assert.throws(() => summarizeUsage({ ...valid, ...invalid }));
});
