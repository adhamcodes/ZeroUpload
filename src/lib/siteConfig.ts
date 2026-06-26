/**
 * siteConfig.ts — the single switch panel for taking ZeroUpload live.
 *
 * Everything here is OFF by default (empty strings). While empty, the site
 * behaves exactly as it does today: no tracking, no ads, no visual change.
 * Fill a value in to turn that feature on at launch — see LAUNCH.md.
 */
export const SITE = {
  /** Production URL (used for canonical/sitemap once you have a domain). */
  url: "https://zeroupload-8e8.pages.dev",

  /**
   * Cloudflare Web Analytics beacon token — privacy-first, cookieless,
   * no consent banner needed. Get it from the Cloudflare dashboard
   * (Analytics & Logs → Web Analytics). Leave empty to disable.
   */
  cloudflareAnalyticsToken: "",

  /**
   * Google AdSense publisher id, e.g. "ca-pub-1234567890123456".
   * Only works after AdSense approves your live domain. Leave empty to
   * keep all ads off.
   */
  adsensePublisherId: "",
};
