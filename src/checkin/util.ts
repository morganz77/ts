import Dropbox from 'dropbox';
import fs from 'fs';
// import { Cookie } from 'puppeteer';
import { Page, Protocol } from 'puppeteer';
import { ExecutionTime, imageTypeSuffix, PathWeibo } from './constants';

export function sanitizeAndGeneratePath(path: string): string {
  const parts = path.split('/');
  const tail = parts[parts.length - 1];
  return `${
    tail.split('?')[0]
  }-${ExecutionTime}-${+new Date()}${imageTypeSuffix}`;
}

export async function loggedIn(page: Page): Promise<boolean> {
  try {
    await page.waitForSelector('.ficon_user');
    console.log(`[+]user already logged in`);
    return true;
  } catch (e) {
    console.log(`[+]user not logged in yet`);
    return false;
  }
}

export async function saveCookies(page: Page) {
  const cookies = await page.cookies();
  console.log(`[+]saving cookies...`);
  console.log(`${cookies}`);
  fs.writeFileSync('cookies', JSON.stringify(cookies));
}

export async function loadCookies(page: Page) {
  try {
    if (!(await fs.existsSync('cookies'))) {
      console.log(`[+]cookies don't exist...`);
      return;
    }
    const cookies = JSON.parse(
      fs.readFileSync('cookies').toString()
    ) as Protocol.Network.CookieParam[];
    console.log(`[+]loading cookies...`);
    console.log(`${cookies}`);
    await page.setCookie(...cookies);
  } catch (e) {
    console.log(`[-]failed loading cookies`);
    console.log(`${e}`);
  }
}

export async function uploadDropbox(
  dbx: Dropbox.Dropbox,
  path: string
): Promise<void> {
  try {
    const response = await dbx.filesUpload({
      path: `${PathWeibo}/${path}`,
      contents: fs.readFileSync(`${path}`),
    });
    const name = response.result.name;
    console.log(`[+]uploading succeed: ${name}`);
  } catch (e) {
    console.error(`[-]uploading failed`);
    console.error(e);
  }
}

export async function getSharedLink(
  dbx: Dropbox.Dropbox,
  path: string
): Promise<string> {
  try {
    const sharingMetadata = await dbx.sharingCreateSharedLinkWithSettings({
      path: `${PathWeibo}/${path}`,
    });
    const link = sharingMetadata.result.url;
    console.log(`[+]link generated: ${link}`);
    return link as string;
  } catch (e) {
    console.error(`[-]link generation error`);
    console.error(e);
    const sharingMetadata = await dbx.sharingGetSharedLinks({
      path: `${PathWeibo}/${path}`,
    });
    const link = sharingMetadata.result.links[0].url;
    if (!!link) {
      console.log(`[+]link retrieved: ${link}`);
    } else {
      console.error(`[-]link retrieving failed`);
      console.error(e);
    }
    return link as string;
  }
}
