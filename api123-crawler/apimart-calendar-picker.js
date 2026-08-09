/**
 * APIMart 日历弹窗日期选择工具
 */

function buildCalendarTarget(dateInfo) {
  const parts = String(dateInfo?.formatted || '').split('/').map((value) => Number(value));
  if (parts.length !== 3 || parts.some((value) => !Number.isFinite(value))) {
    throw new Error(`APIMart 日期格式无效: ${dateInfo?.formatted}`);
  }

  return {
    year: parts[0],
    month: parts[1],
    dayText: String(parts[2]),
  };
}

function parseCalendarMonth(text) {
  const match = String(text || '').match(/(\d{4})年\s*(\d{1,2})月/);
  if (!match) return null;

  return {
    year: Number(match[1]),
    month: Number(match[2]),
  };
}

function getCalendarMonthDelta(current, target) {
  return (target.year - current.year) * 12 + (target.month - current.month);
}

async function getVisibleButtons(scope) {
  const buttons = await scope.locator('button').all();
  const visibleButtons = [];
  for (const button of buttons) {
    if (await button.isVisible().catch(() => false)) {
      visibleButtons.push(button);
    }
  }

  return visibleButtons;
}

async function getCurrentCalendarMonth(scope) {
  const text = await scope.innerText().catch(() => '');
  return parseCalendarMonth(text);
}

async function clickCalendarNav(page, scope, direction) {
  const buttons = await getVisibleButtons(scope);
  const navButtons = [];
  for (const button of buttons) {
    const text = await button.innerText().catch(() => '');
    const disabled = await button.isDisabled().catch(() => false);
    if (text.trim() === '' && !disabled) {
      navButtons.push(button);
    }
  }

  if (navButtons.length < 2) {
    throw new Error('APIMart 日期弹窗未找到月份切换按钮');
  }

  const targetButton = direction < 0 ? navButtons[0] : navButtons[navButtons.length - 1];
  await targetButton.click();
  await page.waitForTimeout(400);
}

async function navigateCalendarToTarget(page, scope, target) {
  for (let i = 0; i < 24; i++) {
    const current = await getCurrentCalendarMonth(scope);
    if (!current) return;

    const delta = getCalendarMonthDelta(current, target);
    if (delta === 0) return;
    await clickCalendarNav(page, scope, delta);
  }

  throw new Error(`APIMart 日期弹窗无法切换到 ${target.year}年${target.month}月`);
}

async function clickCalendarDate(scope, target) {
  const dayValue = `${target.year}/${target.month}/${target.dayText}`;
  const dataDayButton = scope.locator(`button[data-day="${dayValue}"]`).first();
  if (await dataDayButton.isVisible().catch(() => false)) {
    await dataDayButton.click();
    return;
  }

  const ariaDayButton = scope
    .locator(`button[aria-label^="${target.year}年${target.month}月${target.dayText}日"]`)
    .first();
  if (await ariaDayButton.isVisible().catch(() => false)) {
    await ariaDayButton.click();
    return;
  }

  throw new Error(`APIMart 日期弹窗未找到日期 ${dayValue}`);
}

async function selectCalendarDate(page, scope, dateInfo) {
  const target = buildCalendarTarget(dateInfo);
  await navigateCalendarToTarget(page, scope, target);
  await clickCalendarDate(scope, target);
}

module.exports = {
  buildCalendarTarget,
  getCalendarMonthDelta,
  selectCalendarDate,
};
