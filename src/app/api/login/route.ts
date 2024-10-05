import { NextResponse } from 'next/server';
import * as puppeteer from 'puppeteer-core';
import { executablePath } from 'puppeteer';

// Browser instance caching for reusing
let browser: puppeteer.Browser | null = null;

const AUTO_LOGIN_ID = "110";
const AUTO_LOGIN_PASSWORD = "8806";

export async function POST(request: Request) {
  let page: puppeteer.Page | null = null;

  try {
    if (!browser) {
      browser = await puppeteer.launch({
        headless: false, // Make sure headless is false to see the browser
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: executablePath()
      });
    }

    page = await browser.newPage();

    // Basic settings for page
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
    );

    // Console logs
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    // Network requests and responses
    page.on('request', request => console.log('Request:', request.url()));
    page.on('response', response => console.log('Response:', response.status(), response.url()));

    // Page navigation
    await page.goto('https://a14695.parkingweb.kr/login', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    // Output page content for diagnosing issues
    console.log('Page content:', await page.content());

    // Wait for login elements
    await page.waitForSelector('input[name="userId"]', { visible: true, timeout: 30000 });
    await page.waitForSelector('input[name="userPwd"]', { visible: true, timeout: 30000 });
    await page.waitForSelector('input[type="submit"]', { visible: true, timeout: 30000 });

    // Input your login credentials
    await page.type('input[name="userId"]', AUTO_LOGIN_ID);
    await page.type('input[name="userPwd"]', AUTO_LOGIN_PASSWORD);

    // Submit login form
    await Promise.all([
      page.click('input[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 600000 })
    ]);

    // Check cookies after login
    const cookies = await page.cookies();
    console.log('Cookies after login:', cookies);

    // Verify login status
    const isLoggedIn = await page.evaluate(() => {
      return !!document.querySelector('.user-info') || !!document.querySelector('#logout-button');
    });

    if (isLoggedIn) {
      await page.goto('https://a14695.parkingweb.kr/vehicle-registration', {
        waitUntil: 'networkidle2',
        timeout: 600000
      });
      const currentUrl = page.url();
      console.log('Current URL after login:', currentUrl);

      return NextResponse.json({ success: true, currentUrl });
    } else {
      console.log('Cookies after potential login failure:', cookies);
      return NextResponse.json({ success: false, message: 'Login failed. Please check your credentials.' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  } finally {
    if (page) {
      await page.close();
    }
  }
}
