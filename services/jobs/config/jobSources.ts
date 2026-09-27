export type CompanyIndustry = 'fastfood' | 'retail' | 'warehouse' | 'tech' | 'petcare';

export interface CompanySourceConfig {
  token: string;
  displayName: string;
  color: string;
  logoUrl: string;
  websiteDomain: string;
  industry: CompanyIndustry;
}

const buildLogoUrl = (domain: string) =>
  `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`;

/**
 * Verified Greenhouse company board tokens with active public job boards.
 * Endpoint: https://boards-api.greenhouse.io/v1/boards/{token}/jobs
 */
export const GREENHOUSE_COMPANIES: CompanySourceConfig[] = [
  // Fast Food & Beverage
  { token: 'sweetgreen', displayName: 'Sweetgreen', color: '#1B4D3E', websiteDomain: 'sweetgreen.com', logoUrl: buildLogoUrl('sweetgreen.com'), industry: 'fastfood' },
  { token: 'diginn', displayName: 'Dig Inn', color: '#E05A47', websiteDomain: 'diginn.com', logoUrl: buildLogoUrl('diginn.com'), industry: 'fastfood' },
  { token: 'toast', displayName: 'Toast', color: '#FF4F00', websiteDomain: 'toasttab.com', logoUrl: buildLogoUrl('toasttab.com'), industry: 'tech' },

  // Retail & Fashion
  { token: 'glossier', displayName: 'Glossier', color: '#FF758F', websiteDomain: 'glossier.com', logoUrl: buildLogoUrl('glossier.com'), industry: 'retail' },
  { token: 'everlane', displayName: 'Everlane', color: '#2B2B2B', websiteDomain: 'everlane.com', logoUrl: buildLogoUrl('everlane.com'), industry: 'retail' },

  // Warehouse, Fulfillment & Logistics
  { token: 'hellofresh', displayName: 'HelloFresh', color: '#94C11F', websiteDomain: 'hellofresh.com', logoUrl: buildLogoUrl('hellofresh.com'), industry: 'warehouse' },
  { token: 'flexport', displayName: 'Flexport', color: '#002B49', websiteDomain: 'flexport.com', logoUrl: buildLogoUrl('flexport.com'), industry: 'warehouse' },
  { token: 'instacart', displayName: 'Instacart', color: '#43B02A', websiteDomain: 'instacart.com', logoUrl: buildLogoUrl('instacart.com'), industry: 'warehouse' },
  { token: 'samsara', displayName: 'Samsara', color: '#0A2540', websiteDomain: 'samsara.com', logoUrl: buildLogoUrl('samsara.com'), industry: 'warehouse' },
  { token: 'carvana', displayName: 'Carvana', color: '#00AEEF', websiteDomain: 'carvana.com', logoUrl: buildLogoUrl('carvana.com'), industry: 'tech' },

  // Creative & Product Design
  { token: 'figma', displayName: 'Figma', color: '#F24E1E', websiteDomain: 'figma.com', logoUrl: buildLogoUrl('figma.com'), industry: 'tech' },

  // AI Labs & Unicorns
  { token: 'anthropic', displayName: 'Anthropic', color: '#D97706', websiteDomain: 'anthropic.com', logoUrl: buildLogoUrl('anthropic.com'), industry: 'tech' },
  { token: 'scaleai', displayName: 'Scale AI', color: '#10B981', websiteDomain: 'scale.com', logoUrl: buildLogoUrl('scale.com'), industry: 'tech' },

  // Modern Developer Tools & Cloud
  { token: 'vercel', displayName: 'Vercel', color: '#000000', websiteDomain: 'vercel.com', logoUrl: buildLogoUrl('vercel.com'), industry: 'tech' },
  { token: 'stripe', displayName: 'Stripe', color: '#635BFF', websiteDomain: 'stripe.com', logoUrl: buildLogoUrl('stripe.com'), industry: 'tech' },
  { token: 'cloudflare', displayName: 'Cloudflare', color: '#F38020', websiteDomain: 'cloudflare.com', logoUrl: buildLogoUrl('cloudflare.com'), industry: 'tech' },
  { token: 'databricks', displayName: 'Databricks', color: '#FF3621', websiteDomain: 'databricks.com', logoUrl: buildLogoUrl('databricks.com'), industry: 'tech' },
  { token: 'elastic', displayName: 'Elastic', color: '#07A0DD', websiteDomain: 'elastic.co', logoUrl: buildLogoUrl('elastic.co'), industry: 'tech' },
  { token: 'tailscale', displayName: 'Tailscale', color: '#242424', websiteDomain: 'tailscale.com', logoUrl: buildLogoUrl('tailscale.com'), industry: 'tech' },
  { token: 'chainguard', displayName: 'Chainguard', color: '#1565C0', websiteDomain: 'chainguard.dev', logoUrl: buildLogoUrl('chainguard.dev'), industry: 'tech' },

  // Enterprise SaaS
  { token: 'asana', displayName: 'Asana', color: '#FC636B', websiteDomain: 'asana.com', logoUrl: buildLogoUrl('asana.com'), industry: 'tech' },
  { token: 'amplitude', displayName: 'Amplitude', color: '#1C68F8', websiteDomain: 'amplitude.com', logoUrl: buildLogoUrl('amplitude.com'), industry: 'tech' },
  { token: 'braze', displayName: 'Braze', color: '#FF6B6B', websiteDomain: 'braze.com', logoUrl: buildLogoUrl('braze.com'), industry: 'tech' },
  { token: 'klaviyo', displayName: 'Klaviyo', color: '#08AF77', websiteDomain: 'klaviyo.com', logoUrl: buildLogoUrl('klaviyo.com'), industry: 'tech' },
  { token: 'newrelic', displayName: 'New Relic', color: '#008C99', websiteDomain: 'newrelic.com', logoUrl: buildLogoUrl('newrelic.com'), industry: 'tech' },
  { token: 'fastly', displayName: 'Fastly', color: '#FF282D', websiteDomain: 'fastly.com', logoUrl: buildLogoUrl('fastly.com'), industry: 'tech' },
  { token: 'pagerduty', displayName: 'PagerDuty', color: '#06AC38', websiteDomain: 'pagerduty.com', logoUrl: buildLogoUrl('pagerduty.com'), industry: 'tech' },
  { token: 'twilio', displayName: 'Twilio', color: '#F22F46', websiteDomain: 'twilio.com', logoUrl: buildLogoUrl('twilio.com'), industry: 'tech' },
  { token: 'verkada', displayName: 'Verkada', color: '#1E3A5F', websiteDomain: 'verkada.com', logoUrl: buildLogoUrl('verkada.com'), industry: 'tech' },
  { token: 'axle', displayName: 'Axle', color: '#4F46E5', websiteDomain: 'axle.insure', logoUrl: buildLogoUrl('axle.insure'), industry: 'tech' },

  // Cybersecurity
  { token: 'zscaler', displayName: 'Zscaler', color: '#005DA5', websiteDomain: 'zscaler.com', logoUrl: buildLogoUrl('zscaler.com'), industry: 'tech' },
  { token: 'tanium', displayName: 'Tanium', color: '#00B4E0', websiteDomain: 'tanium.com', logoUrl: buildLogoUrl('tanium.com'), industry: 'tech' },
  { token: 'abnormalsecurity', displayName: 'Abnormal Security', color: '#4F46E5', websiteDomain: 'abnormalsecurity.com', logoUrl: buildLogoUrl('abnormalsecurity.com'), industry: 'tech' },

  // Fintech & Finance
  { token: 'brex', displayName: 'Brex', color: '#F54900', websiteDomain: 'brex.com', logoUrl: buildLogoUrl('brex.com'), industry: 'tech' },
  { token: 'gusto', displayName: 'Gusto', color: '#F43F5E', websiteDomain: 'gusto.com', logoUrl: buildLogoUrl('gusto.com'), industry: 'tech' },
  { token: 'coinbase', displayName: 'Coinbase', color: '#0052FF', websiteDomain: 'coinbase.com', logoUrl: buildLogoUrl('coinbase.com'), industry: 'tech' },
  { token: 'robinhood', displayName: 'Robinhood', color: '#00C805', websiteDomain: 'robinhood.com', logoUrl: buildLogoUrl('robinhood.com'), industry: 'tech' },
  { token: 'affirm', displayName: 'Affirm', color: '#4B2DC8', websiteDomain: 'affirm.com', logoUrl: buildLogoUrl('affirm.com'), industry: 'tech' },
  { token: 'sofi', displayName: 'SoFi', color: '#00A0DF', websiteDomain: 'sofi.com', logoUrl: buildLogoUrl('sofi.com'), industry: 'tech' },
  { token: 'betterment', displayName: 'Betterment', color: '#0A76D3', websiteDomain: 'betterment.com', logoUrl: buildLogoUrl('betterment.com'), industry: 'tech' },
  { token: 'blend', displayName: 'Blend', color: '#6E40C9', websiteDomain: 'blend.com', logoUrl: buildLogoUrl('blend.com'), industry: 'tech' },
  { token: 'block', displayName: 'Block (Square)', color: '#00D632', websiteDomain: 'block.xyz', logoUrl: buildLogoUrl('block.xyz'), industry: 'tech' },

  // Consumer Social & High-End Platforms
  { token: 'discord', displayName: 'Discord', color: '#5865F2', websiteDomain: 'discord.com', logoUrl: buildLogoUrl('discord.com'), industry: 'tech' },
  { token: 'reddit', displayName: 'Reddit', color: '#FF4500', websiteDomain: 'reddit.com', logoUrl: buildLogoUrl('reddit.com'), industry: 'tech' },
  { token: 'pinterest', displayName: 'Pinterest', color: '#E60023', websiteDomain: 'pinterest.com', logoUrl: buildLogoUrl('pinterest.com'), industry: 'tech' },
  { token: 'roblox', displayName: 'Roblox', color: '#000000', websiteDomain: 'roblox.com', logoUrl: buildLogoUrl('roblox.com'), industry: 'tech' },
  { token: 'twitch', displayName: 'Twitch', color: '#9146FF', websiteDomain: 'twitch.tv', logoUrl: buildLogoUrl('twitch.tv'), industry: 'tech' },
  { token: 'datadog', displayName: 'Datadog', color: '#632CA6', websiteDomain: 'datadoghq.com', logoUrl: buildLogoUrl('datadoghq.com'), industry: 'tech' },
  { token: 'airbnb', displayName: 'Airbnb', color: '#FF5A5F', websiteDomain: 'airbnb.com', logoUrl: buildLogoUrl('airbnb.com'), industry: 'tech' },
  { token: 'lyft', displayName: 'Lyft', color: '#FF00BF', websiteDomain: 'lyft.com', logoUrl: buildLogoUrl('lyft.com'), industry: 'tech' },
  { token: 'dropbox', displayName: 'Dropbox', color: '#0061FF', websiteDomain: 'dropbox.com', logoUrl: buildLogoUrl('dropbox.com'), industry: 'tech' },
  { token: 'duolingo', displayName: 'Duolingo', color: '#58CC02', websiteDomain: 'duolingo.com', logoUrl: buildLogoUrl('duolingo.com'), industry: 'tech' },
  { token: 'salesloft', displayName: 'Salesloft', color: '#374BFF', websiteDomain: 'salesloft.com', logoUrl: buildLogoUrl('salesloft.com'), industry: 'tech' },
  { token: 'lattice', displayName: 'Lattice', color: '#614FE4', websiteDomain: 'lattice.com', logoUrl: buildLogoUrl('lattice.com'), industry: 'tech' },

  // Additional public boards: engineering, AI, finance, commerce, and media
  { token: '1password', displayName: '1Password', color: '#1A8CFF', websiteDomain: '1password.com', logoUrl: buildLogoUrl('1password.com'), industry: 'tech' },
  { token: 'airtable', displayName: 'Airtable', color: '#18BFFF', websiteDomain: 'airtable.com', logoUrl: buildLogoUrl('airtable.com'), industry: 'tech' },
  { token: 'doordash', displayName: 'DoorDash', color: '#FF3008', websiteDomain: 'doordash.com', logoUrl: buildLogoUrl('doordash.com'), industry: 'tech' },
  { token: 'gitlab', displayName: 'GitLab', color: '#FC6D26', websiteDomain: 'gitlab.com', logoUrl: buildLogoUrl('gitlab.com'), industry: 'tech' },
  { token: 'hubspot', displayName: 'HubSpot', color: '#FF7A59', websiteDomain: 'hubspot.com', logoUrl: buildLogoUrl('hubspot.com'), industry: 'tech' },
  { token: 'mongodb', displayName: 'MongoDB', color: '#00ED64', websiteDomain: 'mongodb.com', logoUrl: buildLogoUrl('mongodb.com'), industry: 'tech' },
  { token: 'okta', displayName: 'Okta', color: '#007DC1', websiteDomain: 'okta.com', logoUrl: buildLogoUrl('okta.com'), industry: 'tech' },
  { token: 'squarespace', displayName: 'Squarespace', color: '#000000', websiteDomain: 'squarespace.com', logoUrl: buildLogoUrl('squarespace.com'), industry: 'tech' },
  { token: 'uber', displayName: 'Uber', color: '#000000', websiteDomain: 'uber.com', logoUrl: buildLogoUrl('uber.com'), industry: 'tech' },
  { token: 'zillow', displayName: 'Zillow', color: '#006AFF', websiteDomain: 'zillow.com', logoUrl: buildLogoUrl('zillow.com'), industry: 'tech' },
  { token: 'zoom', displayName: 'Zoom', color: '#2D8CFF', websiteDomain: 'zoom.us', logoUrl: buildLogoUrl('zoom.us'), industry: 'tech' },
];

/**
 * Verified Lever companies with active public postings.
 * Endpoint: https://api.lever.co/v0/postings/{token}?mode=json
 */
export const LEVER_COMPANIES: CompanySourceConfig[] = [
  // Fast Food & Coffee
  { token: 'bluebottlecoffee', displayName: 'Blue Bottle Coffee', color: '#00A3E0', websiteDomain: 'bluebottlecoffee.com', logoUrl: buildLogoUrl('bluebottlecoffee.com'), industry: 'fastfood' },

  // Warehouse & Quick Commerce (Philly HQ!)
  { token: 'gopuff', displayName: 'Gopuff', color: '#00B4D8', websiteDomain: 'gopuff.com', logoUrl: buildLogoUrl('gopuff.com'), industry: 'warehouse' },

  // Pet Care & Gigs
  { token: 'rover', displayName: 'Rover', color: '#00BA94', websiteDomain: 'rover.com', logoUrl: buildLogoUrl('rover.com'), industry: 'petcare' },

  // Tech, Media & Enterprise
  { token: 'spotify', displayName: 'Spotify', color: '#1DB954', websiteDomain: 'spotify.com', logoUrl: buildLogoUrl('spotify.com'), industry: 'tech' },
  { token: 'palantir', displayName: 'Palantir', color: '#101113', websiteDomain: 'palantir.com', logoUrl: buildLogoUrl('palantir.com'), industry: 'tech' },
  { token: 'wealthfront', displayName: 'Wealthfront', color: '#4840BB', websiteDomain: 'wealthfront.com', logoUrl: buildLogoUrl('wealthfront.com'), industry: 'tech' },
  { token: 'arcadia', displayName: 'Arcadia', color: '#2D7D46', websiteDomain: 'arcadia.com', logoUrl: buildLogoUrl('arcadia.com'), industry: 'tech' },

  // Additional Lever boards with remote and early-career coverage
  { token: 'checkr', displayName: 'Checkr', color: '#5B5CE2', websiteDomain: 'checkr.com', logoUrl: buildLogoUrl('checkr.com'), industry: 'tech' },
  { token: 'faire', displayName: 'Faire', color: '#000000', websiteDomain: 'faire.com', logoUrl: buildLogoUrl('faire.com'), industry: 'tech' },
  { token: 'patreon', displayName: 'Patreon', color: '#FF424D', websiteDomain: 'patreon.com', logoUrl: buildLogoUrl('patreon.com'), industry: 'tech' },
  { token: 'vanta', displayName: 'Vanta', color: '#4C47F7', websiteDomain: 'vanta.com', logoUrl: buildLogoUrl('vanta.com'), industry: 'tech' },
  { token: 'webflow', displayName: 'Webflow', color: '#146EF5', websiteDomain: 'webflow.com', logoUrl: buildLogoUrl('webflow.com'), industry: 'tech' },
];

export function getCompanyMeta(
  companyToken: string,
  fallbackName?: string,
  domainHint?: string
): { displayName: string; color: string; logoUrl: string; industry?: CompanyIndustry } {
  const norm = companyToken.toLowerCase().trim();
  const gh = GREENHOUSE_COMPANIES.find((c) => c.token === norm || c.displayName.toLowerCase() === norm);
  if (gh) return { displayName: gh.displayName, color: gh.color, logoUrl: gh.logoUrl, industry: gh.industry };

  const lever = LEVER_COMPANIES.find((c) => c.token === norm || c.displayName.toLowerCase() === norm);
  if (lever) return { displayName: lever.displayName, color: lever.color, logoUrl: lever.logoUrl, industry: lever.industry };

  const inferredDomain = domainHint || `${norm.replace(/[^a-z0-9]/g, '')}.com`;
  return {
    displayName: fallbackName || companyToken,
    color: '#6366F1',
    logoUrl: buildLogoUrl(inferredDomain),
  };
}
