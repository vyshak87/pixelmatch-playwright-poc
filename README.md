# Pixelmatch + Playwright POC (Backstop-style report)

## What
Small POC that uses Playwright to capture screenshots and Pixelmatch to compare.
Generates a Backstop-style grid HTML report at `reports/index.html`.

## Quick start
1. npm install
2. npx playwright install --with-deps
3. npx playwright test src/tests/visual.login.spec.js
4. If baseline created, re-run. Then run: node src/utils/report-generator.js
5. Open reports/index.html in browser.
