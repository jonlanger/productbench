/**
 * One-shot generator: fills visual sources for catalog products missing curated entries.
 * Prefer curated overrides in PRODUCT_VISUAL_SOURCES for hard-to-scrape products.
 *
 *   npx tsx scripts/generate-visual-sources.ts
 */
import fs from "fs";
import { products } from "../src/data/products";
import type { VisualSourceGroup } from "../src/data/visual-sources";

/** Keys already hand-curated in visual-sources.ts (do not regenerate). */
const CURATED_SLUGS = new Set([
  "notion",
  "linear",
  "figma",
  "stripe-dashboard",
  "vercel",
  "github",
  "gitlab",
  "slack",
  "asana",
  "jira",
  "confluence",
  "airtable",
  "hubspot",
  "intercom",
  "zendesk",
  "datadog",
  "miro",
  "monday",
  "shopify-admin",
  "salesforce",
  "okta",
  "zoom",
  "discord",
  "spotify",
  "netflix",
  "airbnb",
  "uber",
  "loom",
  "webflow",
  "framer",
  "canva",
  "twilio",
  "snowflake",
  "databricks",
  "chatgpt",
  "aws-console",
  "looker",
  "power-bi",
  "tableau",
  "workday",
  "servicenow",
  "sap-s4hana",
  "palantir-foundry",
  "robinhood",
  "coinbase",
  "doordash",
  "tesla-service",
  "autodesk-fusion",
  "plm-teamcenter",
  "epic-hyperspace",
]);

function origin(website: string) {
  try {
    const u = new URL(website);
    return `${u.protocol}//${u.host}`;
  } catch {
    return website.replace(/\/$/, "");
  }
}

const OVERRIDES: Record<string, VisualSourceGroup> = {
  "adobe-xd": {
    homepage: "https://www.adobe.com/products/xd.html",
    help: [
      "https://helpx.adobe.com/xd/user-guide.html",
      "https://helpx.adobe.com/xd/get-started.html",
    ],
    technical: ["https://adobexdplatform.com/plugin-docs/"],
    supporting: ["https://helpx.adobe.com/xd/help/share.html"],
    youtube: ["https://www.youtube.com/watch?v=iW0jM83jcnE"],
    appStoreId: "1146597773",
  },
  "adobe-photoshop": {
    homepage: "https://www.adobe.com/products/photoshop.html",
    help: [
      "https://helpx.adobe.com/photoshop/user-guide.html",
      "https://helpx.adobe.com/photoshop/get-started.html",
    ],
    technical: ["https://developer.adobe.com/photoshop/uxp/2022/"],
    supporting: ["https://helpx.adobe.com/photoshop/using/workspace-basics.html"],
    youtube: ["https://www.youtube.com/watch?v=IyR_uYsRdPs"],
    appStoreId: "1457771281",
    appStoreIds: ["331975235"],
  },
  autocad: {
    homepage: "https://www.autodesk.com/products/autocad",
    help: [
      "https://help.autodesk.com/view/ACD/ENU/",
      "https://www.autodesk.com/support/technical/product/autocad",
    ],
    technical: ["https://aps.autodesk.com/developer/overview/autocad"],
    supporting: ["https://www.autodesk.com/products/autocad/overview"],
    youtube: ["https://www.youtube.com/watch?v=v6VY48n_YYQ"],
    appStoreId: "393149734",
  },
  solidworks: {
    homepage: "https://www.solidworks.com",
    help: [
      "https://help.solidworks.com/",
      "https://www.solidworks.com/support/resource-center",
    ],
    technical: [
      "https://help.solidworks.com/2024/english/api/sldworksapiprogguide/Welcome.htm",
    ],
    supporting: ["https://www.solidworks.com/support/subscription-services"],
    youtube: ["https://www.youtube.com/watch?v=HiOP2P0k1o0"],
    appStoreId: "919516558",
  },
  ansys: {
    homepage: "https://www.ansys.com",
    help: [
      "https://ansyshelp.ansys.com/",
      "https://www.ansys.com/training-center",
    ],
    technical: ["https://ansyshelp.ansys.com/public/"],
    supporting: ["https://www.ansys.com/products"],
    youtube: ["https://www.youtube.com/watch?v=0gqO9Yp2f2Y"],
  },
  magento: {
    homepage:
      "https://business.adobe.com/products/magento/magento-commerce.html",
    help: [
      "https://experienceleague.adobe.com/docs/commerce.html",
      "https://experienceleague.adobe.com/docs/commerce-admin.html",
    ],
    technical: [
      "https://developer.adobe.com/commerce/php/",
      "https://developer.adobe.com/commerce/webapi/",
    ],
    supporting: [
      "https://experienceleague.adobe.com/docs/commerce-operations.html",
    ],
    youtube: ["https://www.youtube.com/watch?v=Yq0QkL4O0mY"],
  },
  marketo: {
    homepage: "https://business.adobe.com/products/marketo/adobe-marketo.html",
    help: [
      "https://experienceleague.adobe.com/docs/marketo.html",
      "https://experienceleague.adobe.com/docs/marketo/using/getting-started.html",
    ],
    technical: ["https://developer.adobe.com/marketo-apis/api/mapi/"],
    supporting: [
      "https://experienceleague.adobe.com/docs/marketo/using/product-docs/administration.html",
    ],
    youtube: ["https://www.youtube.com/watch?v=8QF0qgG0m0E"],
  },
  netsuite: {
    homepage: "https://www.netsuite.com",
    help: [
      "https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/",
      "https://www.netsuite.com/portal/resource/articles.shtml",
    ],
    technical: [
      "https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_N3419689.html",
    ],
    supporting: [
      "https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/book_N3199990.html",
    ],
    youtube: ["https://www.youtube.com/watch?v=6mQJ8p0m2QY"],
    appStoreId: "1449263734",
  },
  "oracle-netsuite": {
    homepage: "https://www.netsuite.com",
    help: ["https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/"],
    technical: [
      "https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_N3419689.html",
    ],
    appStoreId: "1449263734",
  },
  quickbooks: {
    homepage: "https://quickbooks.intuit.com",
    help: [
      "https://quickbooks.intuit.com/learn-support/",
      "https://quickbooks.intuit.com/r/bookkeeping/",
    ],
    technical: [
      "https://developer.intuit.com/app/developer/qbo/docs/get-started",
    ],
    supporting: [
      "https://quickbooks.intuit.com/learn-support/en-us/help-article",
    ],
    youtube: ["https://www.youtube.com/watch?v=0kQJ8p0m2QY"],
    appStoreId: "584606479",
  },
  "cloudflare-dashboard": {
    homepage: "https://www.cloudflare.com",
    help: [
      "https://developers.cloudflare.com/fundamentals/",
      "https://developers.cloudflare.com/learning-paths/",
    ],
    technical: [
      "https://developers.cloudflare.com/api/",
      "https://developers.cloudflare.com/workers/",
      "https://developers.cloudflare.com/dns/",
    ],
    supporting: [
      "https://developers.cloudflare.com/cloudflare-one/",
      "https://developers.cloudflare.com/waf/",
    ],
    youtube: ["https://www.youtube.com/watch?v=v7s2V7Y2k0Q"],
    appStoreId: "1423538627",
    appStoreIds: ["6443476492"],
  },
  crowdstrike: {
    homepage: "https://www.crowdstrike.com",
    help: [
      "https://www.crowdstrike.com/resources/",
      "https://www.crowdstrike.com/blog/",
    ],
    technical: ["https://falcon.crowdstrike.com/documentation/"],
    supporting: ["https://www.crowdstrike.com/products/"],
    youtube: ["https://www.youtube.com/watch?v=0gqO9Yp2f2Y"],
    appStoreId: "1458815656",
  },
  box: {
    homepage: "https://www.box.com",
    help: [
      "https://support.box.com/hc/en-us",
      "https://support.box.com/hc/en-us/categories/360003187911",
    ],
    technical: [
      "https://developer.box.com/guides/",
      "https://developer.box.com/reference/",
    ],
    supporting: [
      "https://support.box.com/hc/en-us/articles/360043696414",
    ],
    youtube: ["https://www.youtube.com/watch?v=Yq0QkL4O0mY"],
    appStoreId: "290853822",
  },
  ashby: {
    homepage: "https://www.ashbyhq.com",
    help: ["https://www.ashbyhq.com/blog", "https://www.ashbyhq.com/resources"],
    technical: ["https://developers.ashbyhq.com/"],
    supporting: ["https://www.ashbyhq.com/product"],
  },
  pipedrive: {
    homepage: "https://www.pipedrive.com",
    help: [
      "https://support.pipedrive.com/hc/en-us",
      "https://support.pipedrive.com/en/article/",
    ],
    technical: ["https://developers.pipedrive.com/docs/api/v1"],
    supporting: [
      "https://support.pipedrive.com/en/article/getting-started",
    ],
    appStoreId: "921456160",
  },
  instagram: {
    homepage: "https://www.instagram.com",
    help: ["https://help.instagram.com/"],
    technical: ["https://developers.facebook.com/docs/instagram-api/"],
    supporting: ["https://business.instagram.com/"],
    appStoreId: "389801252",
  },
  tiktok: {
    homepage: "https://www.tiktok.com",
    help: ["https://support.tiktok.com/"],
    technical: ["https://developers.tiktok.com/doc/"],
    supporting: ["https://ads.tiktok.com/help/"],
    appStoreId: "835599320",
  },
  twitch: {
    homepage: "https://www.twitch.tv",
    help: ["https://help.twitch.tv/"],
    technical: ["https://dev.twitch.tv/docs/"],
    supporting: ["https://www.twitch.tv/creatorcamp"],
    appStoreId: "460177396",
  },
  duolingo: {
    homepage: "https://www.duolingo.com",
    help: ["https://support.duolingo.com/hc/en-us"],
    technical: ["https://blog.duolingo.com/"],
    supporting: ["https://www.duolingo.com/approach"],
    appStoreId: "570060128",
  },
  etsy: {
    homepage: "https://www.etsy.com",
    help: ["https://help.etsy.com/hc/en-us"],
    technical: ["https://developers.etsy.com/documentation/"],
    supporting: ["https://www.etsy.com/sell"],
    appStoreId: "477128284",
    appStoreIds: ["1534619962"],
  },
  coupa: {
    homepage: "https://www.coupa.com",
    help: ["https://compass.coupa.com/", "https://www.coupa.com/resources"],
    technical: ["https://developer.coupa.com/"],
    supporting: ["https://www.coupa.com/products"],
  },
  todoist: {
    homepage: "https://todoist.com",
    help: ["https://www.todoist.com/help"],
    technical: ["https://developer.todoist.com/"],
    appStoreId: "572688855",
  },
  evernote: {
    homepage: "https://evernote.com",
    help: ["https://help.evernote.com/"],
    technical: ["https://dev.evernote.com/"],
    appStoreId: "281796108",
  },
  strava: {
    homepage: "https://www.strava.com",
    help: ["https://support.strava.com/"],
    technical: ["https://developers.strava.com/docs/"],
    appStoreId: "426826309",
  },
  snapchat: {
    homepage: "https://www.snapchat.com",
    help: ["https://help.snapchat.com/"],
    technical: ["https://developers.snap.com/"],
    appStoreId: "447188370",
  },
  peloton: {
    homepage: "https://www.onepeloton.com",
    help: ["https://support.onepeloton.com/"],
    appStoreId: "792750948",
  },
  headspace: {
    homepage: "https://www.headspace.com",
    help: ["https://help.headspace.com/"],
    appStoreId: "493145008",
  },
  revolut: {
    homepage: "https://www.revolut.com",
    help: ["https://help.revolut.com/"],
    appStoreId: "932493382",
  },
  wise: {
    homepage: "https://wise.com",
    help: ["https://wise.com/help/"],
    technical: ["https://docs.wise.com/"],
    appStoreId: "612261027",
  },
  paypal: {
    homepage: "https://www.paypal.com",
    help: ["https://www.paypal.com/us/cshelp/home"],
    technical: ["https://developer.paypal.com/docs/"],
    appStoreId: "283646709",
  },
  klarna: {
    homepage: "https://www.klarna.com",
    help: ["https://www.klarna.com/us/customer-service/"],
    technical: ["https://docs.klarna.com/"],
    appStoreId: "1115120118",
  },
  chime: {
    homepage: "https://www.chime.com",
    help: ["https://help.chime.com/"],
    appStoreId: "836215269",
  },
  afterpay: {
    homepage: "https://www.afterpay.com",
    help: ["https://help.afterpay.com/"],
    appStoreId: "1401019110",
  },
  yelp: {
    homepage: "https://www.yelp.com",
    help: ["https://www.yelp-support.com/"],
    technical: ["https://docs.developer.yelp.com/"],
    appStoreId: "284910350",
  },
  soundcloud: {
    homepage: "https://soundcloud.com",
    help: ["https://help.soundcloud.com/"],
    technical: ["https://developers.soundcloud.com/docs/api/"],
    appStoreId: "336353151",
  },
  kindle: {
    homepage: "https://www.amazon.com/kindle-dbs/fd/kcp",
    help: ["https://www.amazon.com/gp/help/customer/display.html"],
    appStoreId: "302584613",
  },
  surveymonkey: {
    homepage: "https://www.surveymonkey.com",
    help: ["https://help.surveymonkey.com/"],
    technical: ["https://developer.surveymonkey.com/"],
    appStoreId: "723867634",
  },
  trello: {
    homepage: "https://trello.com",
    help: ["https://support.atlassian.com/trello/"],
    technical: ["https://developer.atlassian.com/cloud/trello/"],
    appStoreId: "461504587",
  },
  "1password": {
    homepage: "https://1password.com",
    help: ["https://support.1password.com/"],
    technical: ["https://developer.1password.com/"],
    appStoreId: "1511601750",
  },
  mailchimp: {
    homepage: "https://mailchimp.com",
    help: ["https://mailchimp.com/help/"],
    technical: ["https://mailchimp.com/developer/"],
    appStoreId: "366794783",
  },
  dropbox: {
    homepage: "https://www.dropbox.com",
    help: ["https://help.dropbox.com/"],
    technical: ["https://www.dropbox.com/developers/documentation"],
    appStoreId: "327630330",
  },
};

function guessDocs(website: string, slug: string): VisualSourceGroup {
  if (OVERRIDES[slug]) return { ...OVERRIDES[slug] };

  const base = origin(website);
  let host = "";
  try {
    host = new URL(base).hostname.replace(/^www\./, "");
  } catch {
    host = "";
  }

  return {
    homepage: website,
    help: [`${base}/help`, `${base}/docs`, `${base}/support`].slice(0, 3),
    technical: [
      `${base}/developers`,
      `${base}/api`,
      host ? `https://docs.${host}` : `${base}/docs/api`,
    ].slice(0, 3),
    supporting: [`${base}/product`, `${base}/features`].slice(0, 2),
  };
}

async function itunesId(name: string): Promise<string | undefined> {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(name)}&entity=software&limit=5&country=us`;
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const data = (await res.json()) as {
      results?: Array<{ trackId: number; trackName: string }>;
    };
    const needle = name.toLowerCase().split(/[\s:(-]+/)[0]!;
    const hit =
      data.results?.find((r) =>
        r.trackName.toLowerCase().includes(needle),
      ) ?? data.results?.[0];
    return hit ? String(hit.trackId) : undefined;
  } catch {
    return undefined;
  }
}

function serialize(obj: Record<string, VisualSourceGroup>) {
  const lines: string[] = [];
  lines.push(
    `/**`,
    ` * Auto-generated visual sources for catalog products missing curated entries.`,
    ` * Merged under PRODUCT_VISUAL_SOURCES (curated wins on key collision).`,
    ` */`,
    `import type { VisualSourceGroup } from "./visual-sources";`,
    ``,
    `export const GENERATED_VISUAL_SOURCES: Record<string, VisualSourceGroup> = {`,
  );

  for (const [slug, group] of Object.entries(obj)) {
    lines.push(`  ${JSON.stringify(slug)}: ${JSON.stringify(group, null, 4).replace(/\n/g, "\n  ")},`);
  }

  lines.push(`};`, ``);
  return lines.join("\n");
}

async function main() {
  const out: Record<string, VisualSourceGroup> = {};
  const missing = products.filter((p) => !CURATED_SLUGS.has(p.slug));
  console.log(`Generating sources for ${missing.length} products…`);

  let i = 0;
  for (const p of missing) {
    i += 1;
    const group = guessDocs(p.website, p.slug);
    if (!group.appStoreId) {
      const id = await itunesId(p.name);
      if (id) group.appStoreId = id;
      await new Promise((r) => setTimeout(r, 110));
    }
    out[p.slug] = group;
    if (i % 25 === 0 || i === missing.length) {
      console.log(`  ${i}/${missing.length}`);
    }
  }

  const path = "src/data/visual-sources-generated.ts";
  fs.writeFileSync(path, serialize(out));
  console.log(
    `Wrote ${path} (${Object.keys(out).length} entries, ${Object.values(out).filter((g) => g.appStoreId).length} with App Store IDs)`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
