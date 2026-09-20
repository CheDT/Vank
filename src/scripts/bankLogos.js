// AUTHENTIC PHILIPPINE BANK & E-WALLET LOGOS (VECTOR SVGS)

export const PHILIPPINE_BANKS = [
  {
    id: 'maya',
    name: 'Maya',
    fullName: 'Maya (PayMaya)',
    defaultNetwork: 'visa',
    defaultGradient: 'gradient-emerald',
    presetName: 'Maya Virtual Visa'
  },
  {
    id: 'gcash',
    name: 'GCash',
    fullName: 'GCash Digital Wallet',
    defaultNetwork: 'mastercard',
    defaultGradient: 'gradient-midnight',
    presetName: 'GCash Mastercard'
  },
  {
    id: 'bdo',
    name: 'BDO',
    fullName: 'BDO Unibank',
    defaultNetwork: 'visa',
    defaultGradient: 'gradient-midnight',
    presetName: 'BDO Debit Visa'
  },
  {
    id: 'bpi',
    name: 'BPI',
    fullName: 'Bank of the Philippine Islands',
    defaultNetwork: 'mastercard',
    defaultGradient: 'gradient-sunset',
    presetName: 'BPI Debit Mastercard'
  },
  {
    id: 'unionbank',
    name: 'UnionBank',
    fullName: 'UnionBank of the Philippines',
    defaultNetwork: 'visa',
    defaultGradient: 'gradient-obsidian',
    presetName: 'UnionBank Digital Visa'
  },
  {
    id: 'gotyme',
    name: 'GoTyme',
    fullName: 'GoTyme Bank',
    defaultNetwork: 'visa',
    defaultGradient: 'gradient-platinum',
    presetName: 'GoTyme Visa Debit'
  },
  {
    id: 'metrobank',
    name: 'Metrobank',
    fullName: 'Metropolitan Bank & Trust Co.',
    defaultNetwork: 'mastercard',
    defaultGradient: 'gradient-midnight',
    presetName: 'Metrobank Mastercard'
  },
  {
    id: 'rcbc',
    name: 'RCBC',
    fullName: 'Rizal Commercial Banking Corp',
    defaultNetwork: 'mastercard',
    defaultGradient: 'gradient-midnight',
    presetName: 'RCBC MyDebit Card'
  },
  {
    id: 'seabank',
    name: 'SeaBank',
    fullName: 'SeaBank Philippines',
    defaultNetwork: 'mastercard',
    defaultGradient: 'gradient-sunset',
    presetName: 'SeaBank Debit'
  },
  {
    id: 'generic',
    name: 'Digital Card',
    fullName: 'Standard Virtual Debit',
    defaultNetwork: 'visa',
    defaultGradient: 'gradient-obsidian',
    presetName: 'Primary Digital Debit'
  }
];

export function getBankLogoSvg(brandId) {
  const brand = (brandId || 'generic').toLowerCase();

  switch (brand) {
    case 'maya':
    case 'paymaya':
      // Maya (PayMaya) sleek lowercase wordmark with signature green accent dot
      return `
        <svg class="bank-brand-svg maya-logo" viewBox="0 0 90 28" fill="none" xmlns="http://www.w3.org/2000/svg" height="22">
          <rect width="90" height="28" rx="6" fill="#09090b" fill-opacity="0.5"/>
          <text x="8" y="19" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="16" font-weight="900" fill="#ffffff" letter-spacing="-0.04em">maya</text>
          <circle cx="56" cy="11" r="3" fill="#00D563"/>
          <path d="M64 12L71 19M71 12L64 19" stroke="#00D563" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      `;

    case 'gcash':
      // GCash iconic radiant blue circle with white monogram and wave
      return `
        <svg class="bank-brand-svg gcash-logo" viewBox="0 0 96 28" fill="none" xmlns="http://www.w3.org/2000/svg" height="22">
          <rect width="96" height="28" rx="6" fill="#005CEE" fill-opacity="0.9"/>
          <circle cx="16" cy="14" r="9" fill="#ffffff"/>
          <path d="M18.5 11.5C17.5 10.5 16 10 14.5 10C12 10 10 12 10 14.5C10 17 12 19 14.5 19C17 19 18.5 17.5 18.8 15.5H14.5" stroke="#005CEE" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <text x="31" y="19" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="14" font-weight="800" fill="#ffffff" letter-spacing="-0.02em">gcash</text>
        </svg>
      `;

    case 'bdo':
      // BDO Unibank bold serif-free blue and yellow bar
      return `
        <svg class="bank-brand-svg bdo-logo" viewBox="0 0 82 28" fill="none" xmlns="http://www.w3.org/2000/svg" height="22">
          <rect width="82" height="28" rx="5" fill="#003087" fill-opacity="0.95"/>
          <text x="9" y="18" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="15" font-weight="900" fill="#ffffff" letter-spacing="0.05em">BDO</text>
          <rect x="9" y="21" width="64" height="2.5" rx="1.25" fill="#F4B223"/>
        </svg>
      `;

    case 'bpi':
      // Bank of the Philippine Islands red shield crest
      return `
        <svg class="bank-brand-svg bpi-logo" viewBox="0 0 76 28" fill="none" xmlns="http://www.w3.org/2000/svg" height="22">
          <rect width="76" height="28" rx="5" fill="#B70002" fill-opacity="0.95"/>
          <path d="M14 6L8 10V18C8 21.5 14 24 14 24C14 24 20 21.5 20 18V10L14 6Z" fill="#F0B51D"/>
          <text x="26" y="19" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="15" font-weight="900" fill="#ffffff" letter-spacing="0.04em">BPI</text>
        </svg>
      `;

    case 'unionbank':
      // UnionBank orange U insignia
      return `
        <svg class="bank-brand-svg unionbank-logo" viewBox="0 0 110 28" fill="none" xmlns="http://www.w3.org/2000/svg" height="22">
          <rect width="110" height="28" rx="5" fill="#121215" fill-opacity="0.75"/>
          <path d="M11 8V15C11 18 13.5 20 16.5 20C19.5 20 22 18 22 15V8" stroke="#FF6A00" stroke-width="3" stroke-linecap="round"/>
          <text x="28" y="18" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="12" font-weight="800" fill="#ffffff" letter-spacing="-0.02em">UnionBank</text>
        </svg>
      `;

    case 'gotyme':
      // GoTyme Bank vibrant infinity ribbon
      return `
        <svg class="bank-brand-svg gotyme-logo" viewBox="0 0 98 28" fill="none" xmlns="http://www.w3.org/2000/svg" height="22">
          <rect width="98" height="28" rx="5" fill="#09090b" fill-opacity="0.75"/>
          <circle cx="15" cy="14" r="6" stroke="#00E5FF" stroke-width="2.5"/>
          <path d="M19 14C19 17 22 19 25 19C28 19 30 17 30 14C30 11 28 9 25 9C22 9 19 11 19 14Z" stroke="#7C3AED" stroke-width="2.5"/>
          <text x="36" y="18" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="13" font-weight="800" fill="#ffffff" letter-spacing="-0.02em">GoTyme</text>
        </svg>
      `;

    case 'metrobank':
      // Metrobank blue diamond M
      return `
        <svg class="bank-brand-svg metrobank-logo" viewBox="0 0 106 28" fill="none" xmlns="http://www.w3.org/2000/svg" height="22">
          <rect width="106" height="28" rx="5" fill="#0B2046" fill-opacity="0.95"/>
          <path d="M15 7L9 14L15 21L21 14L15 7Z" fill="#0072CE"/>
          <path d="M15 10L12 14L15 18L18 14L15 10Z" fill="#ffffff"/>
          <text x="27" y="18" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="12" font-weight="800" fill="#ffffff" letter-spacing="-0.01em">Metrobank</text>
        </svg>
      `;

    case 'rcbc':
      // RCBC blue diamond logo
      return `
        <svg class="bank-brand-svg rcbc-logo" viewBox="0 0 82 28" fill="none" xmlns="http://www.w3.org/2000/svg" height="22">
          <rect width="82" height="28" rx="5" fill="#003865" fill-opacity="0.95"/>
          <path d="M13 7L7 14L13 21L19 14L13 7Z" fill="#F4B223"/>
          <text x="25" y="19" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="14" font-weight="900" fill="#ffffff" letter-spacing="0.05em">RCBC</text>
        </svg>
      `;

    case 'seabank':
      // SeaBank orange wave
      return `
        <svg class="bank-brand-svg seabank-logo" viewBox="0 0 96 28" fill="none" xmlns="http://www.w3.org/2000/svg" height="22">
          <rect width="96" height="28" rx="5" fill="#EE4D2D" fill-opacity="0.95"/>
          <circle cx="16" cy="14" r="7" fill="#ffffff"/>
          <path d="M13.5 12C13.5 11 14.5 10 16 10C17.5 10 18.5 11 18.5 12C18.5 13.5 14 14.5 14 16C14 17 15 18 16 18C17.5 18 18.5 17 18.5 16" stroke="#EE4D2D" stroke-width="2" stroke-linecap="round"/>
          <text x="29" y="18" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="12.5" font-weight="800" fill="#ffffff" letter-spacing="-0.01em">SeaBank</text>
        </svg>
      `;

    default:
      // High-contrast clean digital badge
      return `
        <svg class="bank-brand-svg digital-logo" viewBox="0 0 74 28" fill="none" xmlns="http://www.w3.org/2000/svg" height="22">
          <rect width="74" height="28" rx="5" fill="#18181b" fill-opacity="0.8" stroke="rgba(255,255,255,0.15)"/>
          <circle cx="14" cy="14" r="5" stroke="#ffffff" stroke-width="1.8"/>
          <text x="25" y="18" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="11.5" font-weight="800" fill="#ffffff" letter-spacing="0.02em">BANK</text>
        </svg>
      `;
  }
}

export function detectBankBrand(bankName) {
  if (!bankName) return 'generic';
  const lower = bankName.toLowerCase();
  if (lower.includes('maya') || lower.includes('paymaya')) return 'maya';
  if (lower.includes('gcash')) return 'gcash';
  if (lower.includes('bdo')) return 'bdo';
  if (lower.includes('bpi')) return 'bpi';
  if (lower.includes('unionbank') || lower.includes('union bank')) return 'unionbank';
  if (lower.includes('gotyme') || lower.includes('go tyme')) return 'gotyme';
  if (lower.includes('metrobank') || lower.includes('metro bank')) return 'metrobank';
  if (lower.includes('rcbc')) return 'rcbc';
  if (lower.includes('seabank') || lower.includes('sea bank')) return 'seabank';
  return 'generic';
}
