import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'tests/e2e',use:{baseURL:'http://127.0.0.1:5173',browserName:'chromium',viewport:{width:390,height:844},launchOptions:{channel:'msedge'}},workers:1,reporter:'list',timeout:45000});
