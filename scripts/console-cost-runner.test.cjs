const assert = require('node:assert/strict');
const test = require('node:test');

const { clickConfirmButton, clickSearchButton } = require('./console-cost-runner.js');

test('clickSearchButton waits for a delayed visible search button', async () => {
  let checks = 0;
  let clicked = false;

  const page = {
    locator(selector) {
      assert.equal(selector, 'button:has(svg.lucide-search)');
      return {
        first() {
          return {
            async isVisible() {
              checks += 1;
              return checks >= 3;
            },
            async click() {
              clicked = true;
            },
          };
        },
      };
    },
    async waitForTimeout() {},
  };

  await clickSearchButton(page, ['button:has(svg.lucide-search)']);

  assert.equal(clicked, true);
  assert.ok(checks >= 3);
});

test('clickConfirmButton supports Chinese button text', async () => {
  let clickedSelector = null;

  const scope = {
    locator(selector) {
      return {
        first() {
          return {
            async isVisible() {
              return selector === 'button:has-text("确定")';
            },
            async click() {
              clickedSelector = selector;
            },
          };
        },
      };
    },
  };

  await clickConfirmButton(scope, [
    'button:has-text("确定")',
    'button:has-text("确认")',
  ]);

  assert.equal(clickedSelector, 'button:has-text("确定")');
});
