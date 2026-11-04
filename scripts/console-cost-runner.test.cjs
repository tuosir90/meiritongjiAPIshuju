const assert = require('node:assert/strict');
const test = require('node:test');

const {
  clickConfirmButton,
  clickSearchButton,
  dismissBlockingNoticeModals,
} = require('./console-cost-runner.js');

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

test('dismissBlockingNoticeModals closes system announcement modal', async () => {
  let clicked = false;
  let waited = false;

  const invisibleButton = {
    async isVisible() {
      return false;
    },
    async click() {},
  };

  const closeButton = {
    async isVisible() {
      return true;
    },
    async click(options) {
      clicked = options.force === true;
    },
  };

  const modal = {
    async innerText() {
      return '系统公告 最近价格波动较大';
    },
    locator(selector) {
      return {
        first() {
          return selector === 'button:has-text("关闭公告")' ? closeButton : invisibleButton;
        },
      };
    },
  };

  const page = {
    locator(selector) {
      if (selector === '.semi-modal-wrap:visible') {
        return {
          async count() {
            return 1;
          },
          nth() {
            return modal;
          },
        };
      }

      return {
        async count() {
          return 0;
        },
        nth() {
          throw new Error('unexpected modal lookup');
        },
      };
    },
    async waitForTimeout() {
      waited = true;
    },
  };

  const closed = await dismissBlockingNoticeModals(page);

  assert.equal(closed, true);
  assert.equal(clicked, true);
  assert.equal(waited, true);
});
