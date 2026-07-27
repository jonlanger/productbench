/**
 * Public-facing technical & supporting document sources.
 * Prefer first-party docs, admin guides, API references, help centers, changelogs.
 * Used by scripts/enrich-screenshots.ts
 */
export type VisualSourceGroup = {
  homepage?: string;
  /** Product help / getting started */
  help?: string[];
  /** Technical docs, API refs, developer portals */
  technical?: string[];
  /** Admin / setup / security / implementation guides */
  supporting?: string[];
  /** Changelogs / release notes (often rich UI captures) */
  releases?: string[];
  /**
   * Official / first-party product demo videos on YouTube.
   * Fallback pulls maxres thumbnails plus auto-generated frame stills (0–3.jpg).
   */
  youtube?: string[];
  /** Apple App Store numeric ID — used to pull public App Store screenshot URLs */
  appStoreId?: string;
  /** Optional additional App Store IDs (companion apps) */
  appStoreIds?: string[];
  notes?: string;
};

/** @deprecated shape still accepted by enricher via flattenSources() */
export type LegacyVisualSource = {
  homepage?: string;
  docs: string[];
  notes?: string;
};

export const PRODUCT_VISUAL_SOURCES: Record<string, VisualSourceGroup> = {
  notion: {
    homepage: "https://www.notion.com",
    help: [
      "https://www.notion.com/help",
      "https://www.notion.com/help/guides",
      "https://www.notion.com/help/category/new-to-notion",
    ],
    technical: [
      "https://developers.notion.com/docs/getting-started",
      "https://developers.notion.com/reference/intro",
    ],
    supporting: [
      "https://www.notion.com/help/category/administration",
      "https://www.notion.com/help/duplicate-or-import-data-into-notion",
    ],
    releases: ["https://www.notion.com/releases"],
    appStoreId: "1232780281",
  },
  linear: {
    homepage: "https://linear.app",
    help: [
      "https://linear.app/docs/default-issue-properties",
      "https://linear.app/docs/creating-issues",
      "https://linear.app/docs/issue-templates",
    ],
    technical: [
      "https://linear.app/docs/api-and-webhooks",
      "https://studio.apollographql.com/public/Linear-API/variant/current/home",
      "https://developers.linear.app/docs",
    ],
    supporting: [
      "https://linear.app/docs/security",
      "https://linear.app/docs/permissions",
      "https://linear.app/docs/imports",
    ],
    releases: [
      "https://linear.app/changelog",
      "https://linear.app/docs/releases",
    ],
    appStoreId: "1550927206",
  },
  figma: {
    homepage: "https://www.figma.com",
    help: [
      "https://help.figma.com/hc/en-us/articles/360039827524-Get-started-with-Figma-Design",
      "https://help.figma.com/hc/en-us/articles/360040328614-Guide-to-Dev-Mode",
      "https://help.figma.com/hc/en-us/articles/360038662654-Guide-to-components-in-Figma",
    ],
    technical: [
      "https://www.figma.com/developers/api",
      "https://www.figma.com/plugin-docs/",
    ],
    supporting: [
      "https://help.figma.com/hc/en-us/articles/360039828154-Admin-settings",
      "https://help.figma.com/hc/en-us/articles/360039827834-View-and-edit-permissions",
    ],
    releases: ["https://www.figma.com/release-notes/"],
    appStoreId: "1175673405",
  },
  "stripe-dashboard": {
    homepage: "https://stripe.com",
    help: [
      "https://docs.stripe.com/get-started/account/dashboard",
      "https://docs.stripe.com/dashboard",
    ],
    technical: [
      "https://docs.stripe.com/payments",
      "https://docs.stripe.com/api",
      "https://docs.stripe.com/webhooks",
      "https://docs.stripe.com/checkout/quickstart",
    ],
    supporting: [
      "https://docs.stripe.com/security",
      "https://docs.stripe.com/radar",
      "https://docs.stripe.com/connect",
    ],
    releases: ["https://stripe.com/blog/engineering"],
  },
  vercel: {
    homepage: "https://vercel.com",
    help: ["https://vercel.com/docs/getting-started-with-vercel"],
    technical: [
      "https://vercel.com/docs",
      "https://vercel.com/docs/rest-api",
      "https://vercel.com/docs/cli",
      "https://vercel.com/docs/functions",
    ],
    supporting: [
      "https://vercel.com/docs/accounts/create-an-account",
      "https://vercel.com/docs/projects/environment-variables",
      "https://vercel.com/docs/security",
    ],
    releases: ["https://vercel.com/changelog"],
  },
  github: {
    homepage: "https://github.com",
    help: [
      "https://docs.github.com/en/get-started",
      "https://docs.github.com/en/issues",
      "https://docs.github.com/en/pull-requests",
    ],
    technical: [
      "https://docs.github.com/en/rest",
      "https://docs.github.com/en/actions",
      "https://docs.github.com/en/graphql",
      "https://docs.github.com/en/codespaces",
    ],
    supporting: [
      "https://docs.github.com/en/organizations",
      "https://docs.github.com/en/enterprise-cloud@latest/admin",
      "https://docs.github.com/en/code-security",
    ],
    releases: ["https://github.blog/changelog/"],
  },
  gitlab: {
    homepage: "https://gitlab.com",
    help: [
      "https://docs.gitlab.com/ee/user/get_started/",
      "https://docs.gitlab.com/ee/user/project/merge_requests/",
    ],
    technical: [
      "https://docs.gitlab.com/ee/api/rest/",
      "https://docs.gitlab.com/ee/ci/",
      "https://docs.gitlab.com/ee/user/project/repository/",
    ],
    supporting: [
      "https://docs.gitlab.com/ee/administration/",
      "https://docs.gitlab.com/ee/security/",
      "https://docs.gitlab.com/ee/user/group/",
    ],
    releases: ["https://about.gitlab.com/releases/categories/releases/"],
  },
  slack: {
    homepage: "https://slack.com",
    help: [
      "https://slack.com/help/articles/360000488283-Guide-to-Slack",
      "https://slack.com/help/articles/115004071768-What-is-Slack-",
    ],
    technical: [
      "https://api.slack.com/docs",
      "https://api.slack.com/apis",
      "https://api.slack.com/automation",
      "https://api.slack.com/block-kit",
    ],
    supporting: [
      "https://slack.com/help/articles/360002079527-Guide-to-workspace-administration",
      "https://slack.com/help/articles/360002080088-Guide-to-Slack-Enterprise-Grid-administration",
      "https://api.slack.com/authentication",
    ],
    releases: ["https://slack.com/changelog"],
    appStoreId: "618783545",
  },
  asana: {
    homepage: "https://asana.com",
    help: ["https://asana.com/guide/help", "https://asana.com/guide/get-started"],
    technical: [
      "https://developers.asana.com/docs",
      "https://developers.asana.com/reference/rest-api-reference",
    ],
    supporting: [
      "https://asana.com/guide/help/workspaces/admin",
      "https://asana.com/guide/help/fundamentals/permissions",
    ],
  },
  jira: {
    homepage: "https://www.atlassian.com/software/jira",
    help: [
      "https://support.atlassian.com/jira-software-cloud/docs/get-started-with-jira-software/",
      "https://support.atlassian.com/jira-software-cloud/docs/what-is-the-jira-board/",
    ],
    technical: [
      "https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/",
      "https://developer.atlassian.com/server/jira/platform/jira-rest-api-examples/",
    ],
    supporting: [
      "https://support.atlassian.com/jira-cloud-administration/",
      "https://support.atlassian.com/jira-software-cloud/docs/manage-project-permissions/",
    ],
    releases: ["https://confluence.atlassian.com/jirasoftwarecloud/jira-software-cloud-release-notes-927229978.html"],
  },
  confluence: {
    homepage: "https://www.atlassian.com/software/confluence",
    help: [
      "https://support.atlassian.com/confluence-cloud/docs/get-started-with-confluence-cloud/",
      "https://support.atlassian.com/confluence-cloud/docs/create-edit-and-publish-a-page/",
    ],
    technical: [
      "https://developer.atlassian.com/cloud/confluence/rest/v2/intro/",
    ],
    supporting: [
      "https://support.atlassian.com/confluence-cloud/docs/manage-space-permissions/",
      "https://support.atlassian.com/confluence-cloud/docs/set-up-confluence-cloud/",
    ],
  },
  airtable: {
    homepage: "https://airtable.com",
    help: [
      "https://support.airtable.com/docs/getting-started-with-airtable-bases",
      "https://support.airtable.com/docs/getting-started-with-airtable-interface-designer",
    ],
    technical: [
      "https://airtable.com/developers/web/api/introduction",
      "https://airtable.com/developers/scripting",
    ],
    supporting: [
      "https://support.airtable.com/docs/airtable-admin-panel-overview",
      "https://support.airtable.com/docs/managing-user-groups-in-airtable",
    ],
  },
  hubspot: {
    homepage: "https://www.hubspot.com",
    help: [
      "https://knowledge.hubspot.com/get-started",
      "https://knowledge.hubspot.com/crm-setup",
    ],
    technical: [
      "https://developers.hubspot.com/docs/api/overview",
      "https://developers.hubspot.com/docs/api/crm/understanding-the-crm",
    ],
    supporting: [
      "https://knowledge.hubspot.com/account-management",
      "https://knowledge.hubspot.com/user-management",
      "https://knowledge.hubspot.com/security",
    ],
  },
  intercom: {
    homepage: "https://www.intercom.com",
    help: [
      "https://www.intercom.com/help/en/",
      "https://www.intercom.com/help/en/articles/6589680-getting-started-with-intercom",
    ],
    technical: [
      "https://developers.intercom.com/docs",
      "https://developers.intercom.com/docs/references/rest-api/api.intercom.io/",
    ],
    supporting: [
      "https://www.intercom.com/help/en/collections/3391782-teammate-and-workspace-settings",
    ],
  },
  zendesk: {
    homepage: "https://www.zendesk.com",
    help: [
      "https://support.zendesk.com/hc/en-us/articles/4408821324826",
      "https://support.zendesk.com/hc/en-us/articles/4408886795674",
    ],
    technical: [
      "https://developer.zendesk.com/api-reference/",
      "https://developer.zendesk.com/documentation/",
    ],
    supporting: [
      "https://support.zendesk.com/hc/en-us/articles/4408882237978",
      "https://support.zendesk.com/hc/en-us/sections/4405755594778",
    ],
  },
  datadog: {
    homepage: "https://www.datadoghq.com",
    help: ["https://docs.datadoghq.com/getting_started/"],
    technical: [
      "https://docs.datadoghq.com/api/latest/",
      "https://docs.datadoghq.com/tracing/",
      "https://docs.datadoghq.com/logs/",
      "https://docs.datadoghq.com/dashboards/",
    ],
    supporting: [
      "https://docs.datadoghq.com/account_management/",
      "https://docs.datadoghq.com/security/",
      "https://docs.datadoghq.com/monitors/",
    ],
    releases: ["https://docs.datadoghq.com/release_notes/"],
  },
  miro: {
    homepage: "https://miro.com",
    help: ["https://help.miro.com/hc/en-us"],
    technical: [
      "https://developers.miro.com/docs",
      "https://developers.miro.com/docs/rest-api-build-your-first-hello-world-app",
    ],
    supporting: [
      "https://help.miro.com/hc/en-us/articles/360017572854",
      "https://help.miro.com/hc/en-us/articles/360017572434",
    ],
  },
  monday: {
    homepage: "https://monday.com",
    help: ["https://support.monday.com/hc/en-us"],
    technical: [
      "https://developer.monday.com/api-reference/docs",
      "https://developer.monday.com/apps/docs/intro",
    ],
    supporting: ["https://support.monday.com/hc/en-us/categories/360000013679"],
  },
  "shopify-admin": {
    homepage: "https://www.shopify.com",
    help: [
      "https://help.shopify.com/en/manual/intro-to-shopify",
      "https://help.shopify.com/en/manual/products",
      "https://help.shopify.com/en/manual/orders",
    ],
    technical: [
      "https://shopify.dev/docs/api/admin-graphql",
      "https://shopify.dev/docs/apps/build",
      "https://shopify.dev/docs/api/ajax",
    ],
    supporting: [
      "https://help.shopify.com/en/manual/your-account/staff-accounts",
      "https://help.shopify.com/en/manual/checkout-settings",
      "https://shopify.dev/docs/apps/launch/billing",
    ],
  },
  salesforce: {
    homepage: "https://www.salesforce.com",
    help: [
      "https://help.salesforce.com/s/articleView?id=sf.basics_welcome.htm",
      "https://trailhead.salesforce.com/content/learn/modules/lex_migration_introduction",
    ],
    technical: [
      "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/",
      "https://developer.salesforce.com/docs/platform/lwc/guide",
      "https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/",
    ],
    supporting: [
      "https://help.salesforce.com/s/articleView?id=sf.admin_setup.htm",
      "https://help.salesforce.com/s/articleView?id=sf.security_overview.htm",
      "https://help.salesforce.com/s/articleView?id=sf.users_profiles.htm",
    ],
    youtube: ["https://www.youtube.com/watch?v=tCIiWdnH738"],
    appStoreId: "404249815",
  },
  okta: {
    homepage: "https://www.okta.com",
    help: ["https://help.okta.com/en-us/content/index.htm"],
    technical: [
      "https://developer.okta.com/docs/guides/",
      "https://developer.okta.com/docs/reference/",
      "https://developer.okta.com/docs/concepts/",
    ],
    supporting: [
      "https://help.okta.com/en-us/content/topics/security/security_overview.htm",
      "https://help.okta.com/en-us/content/topics/users-groups-profiles/usgp-index.htm",
    ],
  },
  zoom: {
    homepage: "https://www.zoom.com",
    help: ["https://support.zoom.com/hc/en"],
    technical: [
      "https://developers.zoom.us/docs/api/",
      "https://developers.zoom.us/docs/meeting-sdk/",
    ],
    supporting: [
      "https://support.zoom.com/hc/en/category?id=kb_category&kb_category=admin",
      "https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0060228",
    ],
  },
  discord: {
    homepage: "https://discord.com",
    help: ["https://support.discord.com/hc/en-us"],
    technical: [
      "https://discord.com/developers/docs/intro",
      "https://discord.com/developers/docs/resources/channel",
      "https://discord.com/developers/docs/topics/gateway",
    ],
    supporting: [
      "https://support.discord.com/hc/en-us/articles/360024871991",
      "https://discord.com/safety",
    ],
  },
  spotify: {
    homepage: "https://www.spotify.com",
    help: ["https://support.spotify.com/"],
    technical: [
      "https://developer.spotify.com/documentation/web-api",
      "https://developer.spotify.com/documentation/web-playback-sdk",
    ],
    supporting: ["https://artists.spotify.com/guide"],
    appStoreId: "324684580",
  },
  netflix: {
    homepage: "https://www.netflix.com",
    help: ["https://help.netflix.com/"],
    technical: ["https://developer.netflix.com/"],
    supporting: ["https://about.netflix.com/en"],
    appStoreId: "363590051",
    youtube: ["https://www.youtube.com/watch?v=GV3HUDMQ-F0"],
  },
  airbnb: {
    homepage: "https://www.airbnb.com",
    help: ["https://www.airbnb.com/help"],
    technical: ["https://www.airbnb.com/partner"],
    supporting: ["https://www.airbnb.com/help/article/2762"],
    appStoreId: "401626263",
  },
  uber: {
    homepage: "https://www.uber.com",
    help: ["https://help.uber.com/"],
    technical: ["https://developer.uber.com/docs"],
    supporting: ["https://www.uber.com/us/en/about/"],
    appStoreId: "368677368",
  },
  loom: {
    homepage: "https://www.loom.com",
    help: ["https://support.loom.com/hc/en-us"],
    technical: ["https://dev.loom.com/"],
    supporting: ["https://support.loom.com/hc/en-us/articles/360002208597"],
  },
  webflow: {
    homepage: "https://webflow.com",
    help: ["https://university.webflow.com/"],
    technical: [
      "https://developers.webflow.com/data/docs",
      "https://developers.webflow.com/designer/docs",
    ],
    supporting: ["https://university.webflow.com/lesson/intro-to-site-settings"],
  },
  framer: {
    homepage: "https://www.framer.com",
    help: ["https://www.framer.com/help/", "https://www.framer.com/learn/"],
    technical: ["https://www.framer.com/developers/"],
    supporting: ["https://www.framer.com/help/articles/how-to-manage-roles-and-permissions/"],
  },
  canva: {
    homepage: "https://www.canva.com",
    help: ["https://www.canva.com/help/"],
    technical: [
      "https://www.canva.dev/docs/apps/",
      "https://www.canva.dev/docs/connect/",
    ],
    supporting: ["https://www.canva.com/help/canva-admin/"],
    youtube: [
      "https://www.youtube.com/watch?v=tCIiWdnH738",
      "https://www.youtube.com/watch?v=tUkCiqHgvm0",
    ],
    appStoreId: "897446215",
  },
  twilio: {
    homepage: "https://www.twilio.com",
    help: ["https://www.twilio.com/docs/usage/troubleshooting"],
    technical: [
      "https://www.twilio.com/docs",
      "https://www.twilio.com/docs/usage/api",
      "https://www.twilio.com/docs/messaging",
      "https://www.twilio.com/docs/voice",
    ],
    supporting: [
      "https://www.twilio.com/docs/iam",
      "https://www.twilio.com/docs/usage/security",
    ],
  },
  snowflake: {
    homepage: "https://www.snowflake.com",
    help: ["https://docs.snowflake.com/en/user-guide-getting-started"],
    technical: [
      "https://docs.snowflake.com/en/developer-guide",
      "https://docs.snowflake.com/en/sql-reference",
      "https://docs.snowflake.com/en/user-guide/ui-snowsight",
    ],
    supporting: [
      "https://docs.snowflake.com/en/user-guide/security",
      "https://docs.snowflake.com/en/user-guide/admin",
    ],
  },
  databricks: {
    homepage: "https://www.databricks.com",
    help: ["https://docs.databricks.com/en/getting-started/index.html"],
    technical: [
      "https://docs.databricks.com/en/dev-tools/index.html",
      "https://docs.databricks.com/api/workspace/introduction",
      "https://docs.databricks.com/en/workspace/index.html",
    ],
    supporting: [
      "https://docs.databricks.com/en/admin/index.html",
      "https://docs.databricks.com/en/security/index.html",
    ],
  },
  chatgpt: {
    homepage: "https://chatgpt.com",
    help: ["https://help.openai.com/en/"],
    technical: [
      "https://platform.openai.com/docs/overview",
      "https://platform.openai.com/docs/api-reference",
      "https://platform.openai.com/docs/guides/text",
    ],
    supporting: [
      "https://platform.openai.com/docs/guides/safety-checks",
      "https://help.openai.com/en/collections/3943089-chatgpt",
    ],
    youtube: ["https://www.youtube.com/watch?v=jV1vkHv4xqI"],
    appStoreId: "6448311069",
  },
  "aws-console": {
    homepage: "https://aws.amazon.com/console",
    help: ["https://docs.aws.amazon.com/awsconsolehelpdocs/latest/gsg/getting-started.html"],
    technical: [
      "https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html",
      "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/concepts.html",
      "https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html",
    ],
    supporting: [
      "https://docs.aws.amazon.com/organizations/latest/userguide/orgs_getting-started.html",
      "https://docs.aws.amazon.com/accounts/latest/reference/manage-acct-security.html",
    ],
  },
  looker: {
    homepage: "https://cloud.google.com/looker",
    help: ["https://cloud.google.com/looker/docs/intro"],
    technical: [
      "https://cloud.google.com/looker/docs/api",
      "https://cloud.google.com/looker/docs/lookml",
      "https://cloud.google.com/looker/docs/exploring-data",
    ],
    supporting: [
      "https://cloud.google.com/looker/docs/admin-panel",
      "https://cloud.google.com/looker/docs/users-and-groups",
    ],
  },
  "power-bi": {
    homepage: "https://powerbi.microsoft.com",
    help: [
      "https://learn.microsoft.com/en-us/power-bi/fundamentals/power-bi-overview",
      "https://learn.microsoft.com/en-us/power-bi/create-reports/",
    ],
    technical: [
      "https://learn.microsoft.com/en-us/rest/api/power-bi/",
      "https://learn.microsoft.com/en-us/power-bi/developer/",
    ],
    supporting: [
      "https://learn.microsoft.com/en-us/power-bi/admin/",
      "https://learn.microsoft.com/en-us/power-bi/enterprise/",
    ],
  },
  tableau: {
    homepage: "https://www.tableau.com",
    help: ["https://help.tableau.com/current/pro/desktop/en-us/gettingstarted_overview.htm"],
    technical: [
      "https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api.htm",
      "https://help.tableau.com/current/api/js_api/en-us/JavaScriptAPI/js_api.htm",
    ],
    supporting: [
      "https://help.tableau.com/current/server/en-us/server.htm",
      "https://help.tableau.com/current/server/en-us/security.htm",
    ],
    youtube: [
      "https://www.youtube.com/watch?v=PCknYfkHnUk",
      "https://www.youtube.com/watch?v=FMfOV09MiU4",
    ],
    appStoreId: "434633927",
  },
  workday: {
    homepage: "https://www.workday.com",
    help: ["https://doc.workday.com/"],
    technical: [
      "https://community.workday.com/sites/default/files/file-hosting/productionapi/index.html",
      "https://doc.workday.com/admin-guide/en-us/integration.html",
    ],
    supporting: [
      "https://doc.workday.com/admin-guide/en-us/home.html",
      "https://doc.workday.com/admin-guide/en-us/security.html",
    ],
  },
  servicenow: {
    homepage: "https://www.servicenow.com",
    help: ["https://www.servicenow.com/docs/"],
    technical: [
      "https://developer.servicenow.com/dev.do#!/reference",
      "https://www.servicenow.com/docs/bundle/yokohama-api-reference/page/integrate/inbound-rest/concept/c_RESTAPI.html",
    ],
    supporting: [
      "https://www.servicenow.com/docs/bundle/yokohama-platform-administration/page/administer/security/concept/c_Security.html",
    ],
    youtube: [
      "https://www.youtube.com/watch?v=yBX-uVTs__I",
      "https://www.youtube.com/watch?v=XErEM1jLxeU",
    ],
    notes: "App UI is often behind login/WAF; docs + official demos are the public surface.",
  },
  "sap-s4hana": {
    homepage: "https://www.sap.com/products/erp/s4hana.html",
    help: ["https://help.sap.com/docs/SAP_S4HANA_CLOUD"],
    technical: [
      "https://api.sap.com/",
      "https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE",
    ],
    supporting: [
      "https://help.sap.com/docs/SAP_FIORI",
      "https://learning.sap.com/",
    ],
    youtube: ["https://www.youtube.com/watch?v=U92jH395wnQ"],
  },
  "palantir-foundry": {
    homepage: "https://www.palantir.com/platforms/foundry/",
    help: ["https://www.palantir.com/docs/foundry/"],
    technical: [
      "https://www.palantir.com/docs/foundry/api/",
      "https://www.palantir.com/docs/foundry/getting-started/",
    ],
    supporting: [
      "https://www.palantir.com/docs/foundry/security/",
      "https://www.palantir.com/docs/foundry/administration/",
    ],
  },
  robinhood: {
    homepage: "https://robinhood.com",
    help: ["https://robinhood.com/us/en/support/"],
    technical: ["https://robinhood.com/us/en/support/articles/"],
    supporting: ["https://cdn.robinhood.com/assets/robinhood/legal/"],
    appStoreId: "938003185",
  },
  coinbase: {
    homepage: "https://www.coinbase.com",
    help: ["https://help.coinbase.com/"],
    technical: [
      "https://docs.cdp.coinbase.com/",
      "https://docs.cloud.coinbase.com/",
    ],
    supporting: ["https://help.coinbase.com/en/coinbase/privacy-security"],
    appStoreId: "886427730",
  },
  doordash: {
    homepage: "https://www.doordash.com",
    help: ["https://help.doordash.com/"],
    technical: ["https://developer.doordash.com/en-US/"],
    supporting: ["https://help.doordash.com/consumers/s/"],
    youtube: ["https://www.youtube.com/watch?v=LQ8SxXD1nJY"],
    appStoreId: "719972451",
    appStoreIds: ["1451754591"],
  },
  "tesla-service": {
    homepage: "https://www.tesla.com",
    help: ["https://www.tesla.com/support"],
    technical: ["https://developer.tesla.com/"],
    supporting: ["https://www.tesla.com/support/car-safety"],
    appStoreId: "582007913",
    appStoreIds: ["1625770308"],
    notes: "Marketing site is often WAF-blocked; App Store screenshots are the reliable public UI source.",
  },
  "autodesk-fusion": {
    homepage: "https://www.autodesk.com/products/fusion-360",
    help: [
      "https://help.autodesk.com/view/fusion360/ENU/",
      "https://www.autodesk.com/support/technical/article/caas/sfdcarticles/sfdcarticles/How-to-get-started-with-Fusion-360.html",
    ],
    technical: [
      "https://help.autodesk.com/view/fusion360/ENU/?guid=GUID-1C665B4D-7BF7-4FDF-98B0-AA7EE12B5AC2",
      "https://aps.autodesk.com/en/docs/design-automation/v3/developers_guide/overview/",
    ],
    supporting: [
      "https://help.autodesk.com/view/fusion360/ENU/?guid=GUID-A92A4B10-3781-4260-B8B0-0E0BF2D0E0C8",
    ],
    youtube: [
      "https://www.youtube.com/watch?v=beebJ6fgVPo",
      "https://www.youtube.com/watch?v=eaVb4NiVazM",
    ],
    appStoreId: "868407340",
  },
  "plm-teamcenter": {
    homepage: "https://plm.sw.siemens.com/en-US/teamcenter/",
    help: ["https://docs.sw.siemens.com/en-US/product/288759070/doc/PL20243107641233.xid2131829/html/index.html"],
    technical: ["https://docs.sw.siemens.com/"],
    supporting: ["https://blogs.sw.siemens.com/teamcenter/"],
  },
  "epic-hyperspace": {
    homepage: "https://www.epic.com",
    help: ["https://open.epic.com/"],
    technical: [
      "https://fhir.epic.com/",
      "https://open.epic.com/Interface",
      "https://open.epic.com/Tutorial",
    ],
    supporting: ["https://open.epic.com/Tutorial/AppOrchard"],
    youtube: ["https://www.youtube.com/watch?v=qhGinfvumcM"],
    notes:
      "Clinical UI is rarely public; open.epic / FHIR docs + public training demos are the available surface.",
  },
};

export function flattenVisualSources(group: VisualSourceGroup): string[] {
  return [
    ...(group.help ?? []),
    ...(group.technical ?? []),
    ...(group.supporting ?? []),
    ...(group.releases ?? []),
  ];
}
