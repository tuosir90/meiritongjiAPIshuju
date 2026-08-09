const assert = require('node:assert/strict');
const test = require('node:test');

const { extractAmountFromCandidateText } = require('./cost-amount-extractor.js');

test('extractAmountFromCandidateText supports Chinese statistical quota label', () => {
  assert.equal(extractAmountFromCandidateText('资源消耗\n统计额度\n$12.34\n总Tokens'), '12.34');
});

test('extractAmountFromCandidateText supports English Statistical quota label', () => {
  assert.equal(
    extractAmountFromCandidateText('Resource Consumption\nStatistical\nquota\n$0.16\nTotal Tokens\n150307'),
    '0.16'
  );
});
