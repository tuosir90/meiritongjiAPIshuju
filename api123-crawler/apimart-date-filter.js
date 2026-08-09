/**
 * APIMart 自定义日期筛选工具
 */

const {
  buildCalendarTarget,
  getCalendarMonthDelta,
  selectCalendarDate,
} = require('./apimart-calendar-picker');

const CUSTOM_DATE_FILTER_SELECTORS = [
  'button:has-text("自定义")',
  '[role="tab"]:has-text("自定义")',
  '[role="button"]:has-text("自定义")',
  'label:has-text("自定义")',
  'span:has-text("自定义")',
  'button:has-text("Custom")',
  '[role="tab"]:has-text("Custom")',
];

const DATE_SCOPE_SELECTORS = [
  '.semi-modal-wrap:visible',
  '.semi-popover:visible',
  '.semi-portal:visible',
  '.ant-modal:visible',
  '.ant-picker-dropdown:visible',
  '.el-dialog:visible',
  '.el-picker-panel:visible',
  '.el-popper:visible',
  '.arco-modal:visible',
  '.arco-trigger-popup:visible',
  '[role="dialog"]:visible',
];

const CONFIRM_SELECTORS = [
  'button:has-text("确定")',
  'button:has-text("确认")',
  'button:has-text("应用")',
  'button:has-text("查询")',
  'button:has-text("OK")',
  'button[type="submit"]',
  '.semi-button-primary',
  '.ant-btn-primary',
  '.el-button--primary',
];

function buildDateRangeInputValues(dateInfo) {
  if (!dateInfo || !dateInfo.startTime || !dateInfo.endTime) {
    throw new Error('APIMart 自定义日期缺少起止时间');
  }

  return [dateInfo.startTime, dateInfo.endTime];
}

async function clickFirstVisible(scope, selectors, label) {
  for (const selector of selectors) {
    const element = scope.locator(selector).first();
    if (!(await element.isVisible().catch(() => false))) continue;
    await element.click();
    return selector;
  }

  throw new Error(`未找到 APIMart ${label}`);
}

async function resolveDateScope(page) {
  await page.waitForTimeout(800);
  for (const selector of DATE_SCOPE_SELECTORS) {
    const scope = page.locator(selector).last();
    if (await scope.isVisible().catch(() => false)) {
      return scope;
    }
  }

  return page;
}

async function getVisibleInputs(scope) {
  const inputs = await scope.locator('input').all();
  const visibleInputs = [];
  for (const input of inputs) {
    if (await input.isVisible().catch(() => false)) {
      visibleInputs.push(input);
    }
  }

  return visibleInputs;
}

async function forceInputValue(input, value) {
  await input.evaluate((element, nextValue) => {
    element.removeAttribute('readonly');
    element.value = nextValue;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

async function fillDateInput(page, input, value) {
  await input.click();
  await page.waitForTimeout(150);
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Backspace');
  await page.keyboard.type(value, { delay: 15 });
  await page.waitForTimeout(150);

  const currentValue = await input.inputValue().catch(() => '');
  if (!currentValue.includes(value.slice(0, 10))) {
    await forceInputValue(input, value);
  }
}

async function fillDateRange(page, scope, dateInfo) {
  const values = buildDateRangeInputValues(dateInfo);
  const inputs = await getVisibleInputs(scope);
  if (inputs.length === 0) {
    await selectCalendarDate(page, scope, dateInfo);
    return;
  }

  if (inputs.length === 1) {
    await fillDateInput(page, inputs[0], `${values[0]} - ${values[1]}`);
    return;
  }

  await fillDateInput(page, inputs[0], values[0]);
  await fillDateInput(page, inputs[1], values[1]);
}

function waitForDateRangeResponse(page, dateInfo) {
  if (!Number.isFinite(dateInfo?.startTimestamp)) return Promise.resolve(null);

  return page
    .waitForResponse(
      (response) =>
        response.url().includes('/api/web/user/self') &&
        response.url().includes(`start_timestamp=${dateInfo.startTimestamp}`),
      { timeout: 15000 }
    )
    .catch(() => null);
}

async function confirmDateRange(page, scope, responsePromise) {
  try {
    await clickFirstVisible(scope, CONFIRM_SELECTORS, '日期确认按钮');
  } catch {
    await clickFirstVisible(page, CONFIRM_SELECTORS, '日期确认按钮');
  }

  await responsePromise;
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
  await page.waitForTimeout(2500);
}

async function applyCustomDateRange(page, dateInfo) {
  console.log('打开 APIMart 自定义日期筛选...');
  const clickedSelector = await clickFirstVisible(page, CUSTOM_DATE_FILTER_SELECTORS, '自定义日期筛选');
  console.log(`找到自定义日期入口: ${clickedSelector}`);

  const scope = await resolveDateScope(page);
  console.log('填写 APIMart 自定义日期范围...');
  console.log(`  起始时间: ${dateInfo.startTime}`);
  console.log(`  结束时间: ${dateInfo.endTime}`);
  const responsePromise = waitForDateRangeResponse(page, dateInfo);
  await fillDateRange(page, scope, dateInfo);

  await page.screenshot({ path: 'debug-date-filled.png' });
  console.log('  已保存日期填写截图: debug-date-filled.png');
  await confirmDateRange(page, scope, responsePromise);
}

module.exports = {
  CUSTOM_DATE_FILTER_SELECTORS,
  applyCustomDateRange,
  buildCalendarTarget,
  buildDateRangeInputValues,
  getCalendarMonthDelta,
};
