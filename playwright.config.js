const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  workers: 2,
  use: {
    trace: 'retain-on-failure',
  },
});
