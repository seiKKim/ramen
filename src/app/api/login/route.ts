import { NextResponse } from 'next/server';
import * as puppeteer from 'puppeteer-core';
import { executablePath } from 'puppeteer';

let browser: puppeteer.Browser | null = null;

const AUTO_LOGIN_ID = "110";
const AUTO_LOGIN_PASSWORD = "8806";

export async function POST(request: Request) {
  let page: puppeteer.Page | null = null;

  try {
    if (!browser) {
      browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: executablePath(),
      });
    }
    
    page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
    );

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('request', request => console.log('Request:', request.url()));
    page.on('response', response => console.log('Response:', response.status(), response.url()));
    page.on('requestfailed', request => console.error(`Request failed: ${request.url()} reason: ${request.failure()?.errorText}`));

    await page.goto('https://a14695.parkingweb.kr/login', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    // 삭제한 후 시도
    await page.deleteCookie(...(await page.cookies()));

    // 기본 페이지 출력
    const pageContent = await page.content();
    console.log('Page content loaded.');

    await page.waitForSelector('input[name="userId"]', { visible: true, timeout: 30000 });
    await page.waitForSelector('input[name="userPwd"]', { visible: true, timeout: 30000 });
    await page.waitForSelector('input[type="submit"]', { visible: true, timeout: 30000 });

    await page.type('input[name="userId"]', AUTO_LOGIN_ID);
    await page.type('input[name="userPwd"]', AUTO_LOGIN_PASSWORD);

    await Promise.all([
      page.click('input[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 }),
    ]);

    const isLoggedIn = await page.evaluate(() => {
      return !!document.querySelector('.user-info') || !!document.querySelector('#logout-button');
    });

    if (isLoggedIn) {
      await page.goto('https://a14695.parkingweb.kr/vehicle-registration', {
        waitUntil: 'networkidle2',
        timeout: 60000,
      });

      const currentUrl = page.url();
      console.log('Current URL after login:', currentUrl);
      const vehiclePageContent = await page.content();
      return NextResponse.json({ success: true, currentUrl, vehiclePageContent });
    } else {
      console.log('Login failed, cookie state:', await page.cookies());
      return NextResponse.json({ success: false, message: 'Login failed. Please check your credentials.' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error during login:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  } finally {
    if (page) {
      await page.close();
    }
  }
}
