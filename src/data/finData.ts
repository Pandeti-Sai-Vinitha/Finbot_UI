/* ─── Sectors ─────────────────────────────────────────────────── */

export const SECTORS: string[] = [
  'Financial Services', 'Diversified', 'Capital Goods', 'Construction Materials',
  'Metals & Mining', 'Power', 'Services', 'Oil, Gas & Consumable Fuels',
  'Forest Materials', 'Information Technology', 'Healthcare', 'Consumer Durables',
  'Realty', 'Chemicals', 'Automobile and Auto Components',
  'Fast Moving Consumer Goods', 'Construction', 'Consumer Services',
  'Textiles', 'Telecommunication', 'Media, Entertainment & Publication', 'Utilities',
]

export const ALL_SECTORS = SECTORS

export const SECTOR_COMPANIES: Record<string, string[]> = {
  'Financial Services':                 ['HDFC Bank', 'ICICI Bank', 'SBI', 'Kotak Mahindra Bank', 'Axis Bank', 'IndusInd Bank', 'Bajaj Finance', 'HDFC Life', 'ICICI Lombard', 'Muthoot Finance', 'Shriram Finance', 'Power Finance Corp'],
  'Diversified':                        ['Reliance Industries', 'ITC', 'Adani Enterprises', 'Mahindra & Mahindra', 'Aditya Birla Capital', 'Godrej Industries'],
  'Capital Goods':                      ['L&T', 'Siemens India', 'ABB India', 'Bharat Electronics', 'HAL', 'BHEL', 'Thermax', 'Cummins India', 'Honeywell Automation'],
  'Construction Materials':             ['UltraTech Cement', 'Grasim Industries', 'Shree Cement', 'Ambuja Cements', 'ACC', 'Dalmia Bharat', 'JK Cement', 'Ramco Cements'],
  'Metals & Mining':                    ['Tata Steel', 'JSW Steel', 'Hindalco', 'Vedanta', 'NMDC', 'Coal India', 'NALCO', 'Steel Authority of India', 'Hindustan Zinc'],
  'Power':                              ['NTPC', 'Power Grid Corp', 'Tata Power', 'Adani Power', 'CESC', 'Torrent Power', 'JSW Energy', 'NHPC'],
  'Services':                           ['TCS', 'Infosys', 'Wipro', 'HCL Technologies', 'Tech Mahindra', 'Mphasis', 'LTIMindtree', 'Persistent Systems', 'Coforge'],
  'Oil, Gas & Consumable Fuels':        ['ONGC', 'BPCL', 'Indian Oil Corp', 'GAIL', 'Oil India', 'Petronet LNG', 'Gujarat Gas'],
  'Forest Materials':                   ['ITC Paperboards', 'West Coast Paper', 'Seshasayee Paper', 'Tamil Nadu Newsprint', 'Star Paper Mills'],
  'Information Technology':             ['TCS', 'Infosys', 'Wipro', 'HCL Technologies', 'Tech Mahindra', 'LTIMindtree', 'Mphasis', 'Persistent Systems', 'Coforge', 'KPIT Technologies'],
  'Healthcare':                         ['Sun Pharma', "Dr. Reddy's", 'Cipla', 'Lupin', 'Apollo Hospitals', 'Fortis Healthcare', 'Max Healthcare', "Divi's Laboratories", 'Torrent Pharma'],
  'Consumer Durables':                  ['Havells India', 'Voltas', 'Blue Star', 'Titan Company', 'Dixon Technologies', 'Whirlpool India', 'Crompton Greaves', 'V-Guard Industries'],
  'Realty':                             ['DLF', 'Godrej Properties', 'Oberoi Realty', 'Macrotech Developers', 'Prestige Estates', 'Phoenix Mills', 'Brigade Enterprises'],
  'Chemicals':                          ['Asian Paints', 'Pidilite Industries', 'SRF', 'Tata Chemicals', 'UPL', 'Deepak Nitrite', 'Aarti Industries', 'Navin Fluorine'],
  'Automobile and Auto Components':     ['Maruti Suzuki', 'Tata Motors', 'Mahindra & Mahindra', 'Hero MotoCorp', 'Bajaj Auto', 'Eicher Motors', 'TVS Motor', 'Ashok Leyland'],
  'Fast Moving Consumer Goods':         ['HUL', 'ITC', 'Britannia Industries', 'Nestle India', 'Dabur India', 'Marico', 'Godrej Consumer Products', 'Colgate-Palmolive', 'Emami'],
  'Construction':                       ['L&T', 'NCC', 'KNR Constructions', 'PNC Infratech', 'Ircon International', 'Kalpataru Projects'],
  'Consumer Services':                  ['Zomato', 'Jubilant FoodWorks', 'InterGlobe Aviation', 'Indian Hotels', 'Lemon Tree Hotels', 'EaseMyTrip'],
  'Textiles':                           ['Page Industries', 'Arvind', 'Vardhman Textiles', 'Raymond', 'KPR Mill', 'Welspun India', 'Trident'],
  'Telecommunication':                  ['Bharti Airtel', 'Vodafone Idea', 'Indus Towers', 'Tata Communications', 'BSNL'],
  'Media, Entertainment & Publication': ['Zee Entertainment', 'PVR Inox', 'Sun TV Network', 'Network18 Media', 'TV18 Broadcast', 'Nazara Technologies'],
  'Utilities':                          ['NTPC', 'Power Grid Corp', 'GAIL', 'Mahanagar Gas', 'Indraprastha Gas', 'Gujarat Gas'],
}

/* ─── Time periods ─────────────────────────────────────────────── */

export const YEARS = ['2021', '2022', '2023', '2024', '2025']
export const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']

/* ─── Metrics ──────────────────────────────────────────────────── */

export const ANNUAL_METRIC_GROUPS: Record<string, string[]> = {
  'Profit & Loss': [
    'Period', 'Sales', 'Expenses', 'Operating Profit', 'OPM %',
    'Other Income', 'Cost of Materials Consumed', 'Employee Benefit Expense',
    'Other Expenses', 'Interest', 'Depreciation', 'Profit Before Tax',
    'Current Tax', 'Deferred Tax', 'Tax', 'Tax %', 'Net Profit', 'EPS in Rs',
  ],
  'Balance Sheet': [
    'Equity Capital', 'Reserves', 'Borrowings', 'Other Liabilities',
    'Total Liabilities', 'Total Equity', 'Fixed Assets', 'CWIP',
    'Investments', 'Total Assets',
  ],
  'Cash Flow': [
    'Cash From Operating Activity',
    'Cash From Investing Activity',
    'Cash From Financing Activity',
  ],
}

export const QUARTERLY_METRICS: string[] = [
  'Period', 'Sales', 'Expenses', 'Operating Profit', 'OPM %',
  'Other Income', 'Cost of Materials Consumed', 'Employee Benefit Expense',
  'Other Expenses', 'Interest', 'Depreciation', 'Profit Before Tax',
  'Current Tax', 'Deferred Tax', 'Tax', 'Tax %', 'Net Profit', 'EPS in Rs',
]

export const ALL_ANNUAL_METRICS: string[] = Object.values(ANNUAL_METRIC_GROUPS).flat()
export const ALL_METRICS = ALL_ANNUAL_METRICS

export const FREQUENTLY_USED_METRICS = [
  'Sales', 'Net Profit', 'EPS in Rs', 'Operating Profit', 'OPM %', 'Total Assets',
]

/* ─── Mock financial data ──────────────────────────────────────── */

type FinRow = Record<string, number | string>

/* [baseSales2021 ₹Cr, growthPct, OPM%, netMarginPct, totalAssets2021 ₹Cr] */
const CO_BASE: Record<string, [number, number, number, number, number]> = {
  'HDFC Bank':              [157000, 14, 28, 18, 2100000],
  'ICICI Bank':             [112000, 16, 25, 17, 1600000],
  'SBI':                    [280000, 12, 22, 12, 4800000],
  'Kotak Mahindra Bank':    [68000,  15, 32, 20, 520000],
  'Axis Bank':              [88000,  13, 22, 14, 1050000],
  'IndusInd Bank':          [42000,  11, 26, 15, 480000],
  'Bajaj Finance':          [28000,  22, 40, 22, 280000],
  'Muthoot Finance':        [9800,   14, 58, 28, 72000],
  'Shriram Finance':        [14000,  16, 45, 20, 180000],
  'TCS':                    [164000, 10, 26, 20, 130000],
  'Infosys':                [122000, 12, 25, 18, 95000],
  'Wipro':                  [62000,  10, 20, 16, 82000],
  'HCL Technologies':       [79000,  12, 22, 17, 90000],
  'Tech Mahindra':          [42000,  10, 12, 8,  55000],
  'Mphasis':                [11000,  18, 20, 15, 12000],
  'LTIMindtree':            [26000,  20, 22, 16, 22000],
  'Persistent Systems':     [8500,   28, 18, 13, 8000],
  'Reliance Industries':    [500000, 12, 16, 8,  1300000],
  'ITC':                    [51000,  9,  38, 27, 58000],
  'Adani Enterprises':      [42000,  35, 8,  3,  340000],
  'L&T':                    [148000, 14, 11, 7,  430000],
  'Siemens India':          [14000,  16, 12, 9,  16000],
  'ABB India':              [8200,   15, 11, 8,  9000],
  'Bharat Electronics':     [13000,  14, 22, 16, 18000],
  'HAL':                    [22000,  12, 18, 12, 32000],
  'BHEL':                   [21000,  6,  6,  2,  55000],
  'UltraTech Cement':       [43000,  12, 20, 10, 90000],
  'Shree Cement':           [15000,  10, 26, 12, 30000],
  'Ambuja Cements':         [13000,  10, 18, 10, 28000],
  'Tata Steel':             [195000, 8,  18, 8,  280000],
  'JSW Steel':              [130000, 10, 17, 7,  200000],
  'Hindalco':               [140000, 8,  12, 6,  200000],
  'Coal India':             [98000,  4,  30, 22, 65000],
  'NTPC':                   [120000, 8,  18, 10, 360000],
  'Power Grid Corp':        [38000,  8,  85, 22, 280000],
  'Tata Power':             [35000,  14, 18, 8,  80000],
  'ONGC':                   [160000, 6,  25, 14, 430000],
  'BPCL':                   [290000, 5,  4,  2,  80000],
  'Indian Oil Corp':        [640000, 4,  3,  1,  185000],
  'GAIL':                   [68000,  8,  12, 7,  65000],
  'Sun Pharma':             [32000,  12, 25, 16, 55000],
  "Dr. Reddy's":            [19000,  11, 22, 14, 32000],
  'Cipla':                  [18000,  10, 22, 13, 30000],
  'Lupin':                  [15000,  9,  18, 10, 28000],
  'Apollo Hospitals':       [14000,  18, 12, 6,  22000],
  'Havells India':          [12000,  14, 12, 8,  14000],
  'Titan Company':          [28000,  20, 10, 7,  18000],
  'Dixon Technologies':     [8500,   35, 4,  2,  6000],
  'DLF':                    [8000,   18, 35, 20, 85000],
  'Godrej Properties':      [5500,   22, 20, 12, 45000],
  'Asian Paints':           [22000,  12, 20, 13, 16000],
  'Pidilite Industries':    [9500,   14, 22, 16, 12000],
  'Maruti Suzuki':          [85000,  11, 10, 6,  72000],
  'Tata Motors':            [250000, 13, 8,  3,  390000],
  'Hero MotoCorp':          [32000,  6,  14, 8,  16000],
  'Bajaj Auto':             [29000,  10, 18, 14, 22000],
  'Eicher Motors':          [11000,  16, 26, 18, 12000],
  'HUL':                    [51000,  9,  22, 14, 22000],
  'Britannia Industries':   [14000,  10, 16, 11, 6000],
  'Nestle India':           [13000,  11, 22, 15, 6000],
  'Dabur India':            [9000,   9,  18, 13, 8000],
  'Bharti Airtel':          [105000, 12, 40, 10, 420000],
  'Vodafone Idea':          [42000,  2,  32, -8, 220000],
  'Zee Entertainment':      [8500,   3,  18, 8,  12000],
  'PVR Inox':               [3200,   15, 16, 4,  8000],
  'Zomato':                 [4200,   60, -12, -5, 18000],
  'InterGlobe Aviation':    [42000,  22, 12, 4,  55000],
  'Page Industries':        [4200,   14, 18, 13, 4000],
  'Vardhman Textiles':      [7500,   8,  14, 8,  14000],
}

export const SEEDED_FINANCIAL_COMPANIES = Object.keys(CO_BASE)

function buildAnnualRow(year: string, idx: number, base: [number,number,number,number,number]): FinRow {
  const [s0, g, opm, nm, a0] = base
  const sales = Math.round(s0 * Math.pow(1 + g / 100, idx))
  const assets = Math.round(a0 * Math.pow(1.1, idx))
  const opProfit = Math.round(sales * (opm + idx * 0.3) / 100)
  const expenses = sales - opProfit
  const netProfit = Math.round(sales * Math.max(nm + idx * 0.2, 1) / 100)
  const otherInc = Math.round(sales * 0.02)
  const cogs = Math.round(expenses * 0.55)
  const emp = Math.round(expenses * 0.2)
  const otherExp = Math.round(expenses * 0.25)
  const interest = Math.round(sales * 0.015)
  const dep = Math.round(sales * 0.03)
  const pbt = opProfit + otherInc - interest - dep
  const tax = Math.round(Math.max(pbt, 0) * 0.25)
  const equity = Math.round(assets * 0.04)
  const reserves = Math.round(assets * 0.38)
  const borrowings = Math.round(assets * 0.25)
  const otherLiab = assets - equity - reserves - borrowings
  const eps = +(netProfit / 280).toFixed(1)
  return {
    Period: year, Sales: sales, Expenses: expenses,
    'Operating Profit': opProfit, 'OPM %': +(opm + idx * 0.3).toFixed(1),
    'Other Income': otherInc, 'Cost of Materials Consumed': cogs,
    'Employee Benefit Expense': emp, 'Other Expenses': otherExp,
    Interest: interest, Depreciation: dep,
    'Profit Before Tax': pbt, 'Current Tax': Math.round(tax * 0.9),
    'Deferred Tax': Math.round(tax * 0.1), Tax: tax, 'Tax %': 25,
    'Net Profit': netProfit, 'EPS in Rs': eps,
    'Equity Capital': equity, Reserves: reserves, Borrowings: borrowings,
    'Other Liabilities': Math.max(0, otherLiab),
    'Total Liabilities': assets, 'Total Equity': equity + reserves,
    'Fixed Assets': Math.round(assets * 0.35), CWIP: Math.round(assets * 0.05),
    Investments: Math.round(assets * 0.15), 'Total Assets': assets,
    'Cash From Operating Activity': Math.round(netProfit * 1.4),
    'Cash From Investing Activity': Math.round(netProfit * -0.8),
    'Cash From Financing Activity': Math.round(netProfit * -0.4),
  }
}

function buildQuarterRow(label: string, annualSales: number, opm: number, nm: number): FinRow {
  const s = Math.round(annualSales * (0.22 + (Math.abs(label.charCodeAt(1) - 50)) * 0.015))
  const opProfit = Math.round(s * opm / 100)
  const expenses = s - opProfit
  const netProfit = Math.round(s * Math.max(nm, 1) / 100)
  const tax = Math.round(netProfit * 0.27)
  return {
    Period: label, Sales: s, Expenses: expenses,
    'Operating Profit': opProfit, 'OPM %': opm,
    'Other Income': Math.round(s * 0.02),
    'Cost of Materials Consumed': Math.round(expenses * 0.55),
    'Employee Benefit Expense': Math.round(expenses * 0.2),
    'Other Expenses': Math.round(expenses * 0.25),
    Interest: Math.round(s * 0.015), Depreciation: Math.round(s * 0.03),
    'Profit Before Tax': Math.round(netProfit * 1.35),
    'Current Tax': Math.round(tax * 0.9), 'Deferred Tax': Math.round(tax * 0.1),
    Tax: tax, 'Tax %': 27, 'Net Profit': netProfit,
    'EPS in Rs': +(netProfit / 280).toFixed(1),
  }
}

export const ANNUAL_DATA: Record<string, Record<string, FinRow>> = {}
export const QUARTERLY_DATA: Record<string, Record<string, FinRow>> = {}

export function getAnnualData(company: string): Record<string, FinRow> {
  if (!ANNUAL_DATA[company]) {
    const base = CO_BASE[company] ?? [10000, 10, 18, 10, 60000]
    ANNUAL_DATA[company] = {}
    YEARS.forEach((yr, i) => { ANNUAL_DATA[company][yr] = buildAnnualRow(yr, i, base) })
  }
  return ANNUAL_DATA[company]
}

export function getQuarterlyData(company: string): Record<string, FinRow> {
  if (!QUARTERLY_DATA[company]) {
    const base = CO_BASE[company] ?? [10000, 10, 18, 10, 60000]
    QUARTERLY_DATA[company] = {}
    YEARS.forEach((yr, yi) => {
      const annualSales = Math.round(base[0] * Math.pow(1 + base[1] / 100, yi))
      QUARTERS.forEach(q => {
        const key = `${q} FY${yr.slice(2)}`
        QUARTERLY_DATA[company][key] = buildQuarterRow(key, annualSales, base[2], base[3])
      })
    })
  }
  return QUARTERLY_DATA[company]
}

/* Pre-build data for key companies */
Object.keys(CO_BASE).forEach(co => { getAnnualData(co); getQuarterlyData(co) })

/* ─── Sector meta for Dashboard display ───────────────────────── */
export const SECTOR_META: Record<string, { exchange: 'NSE/BSE'|'NSE'|'BSE'; cap: string; capNum: number }> = {
  'Financial Services':                 { exchange: 'NSE/BSE', cap: '₹11.8L Cr', capNum: 1180000 },
  'Diversified':                        { exchange: 'NSE/BSE', cap: '₹17.1L Cr', capNum: 1710000 },
  'Capital Goods':                      { exchange: 'NSE/BSE', cap: '₹3.4L Cr',  capNum: 340000 },
  'Construction Materials':             { exchange: 'NSE/BSE', cap: '₹2.8L Cr',  capNum: 280000 },
  'Metals & Mining':                    { exchange: 'NSE/BSE', cap: '₹2.1L Cr',  capNum: 210000 },
  'Power':                              { exchange: 'NSE/BSE', cap: '₹3.5L Cr',  capNum: 350000 },
  'Services':                           { exchange: 'NSE/BSE', cap: '₹14.2L Cr', capNum: 1420000 },
  'Oil, Gas & Consumable Fuels':        { exchange: 'NSE/BSE', cap: '₹3.4L Cr',  capNum: 340000 },
  'Forest Materials':                   { exchange: 'BSE',     cap: '₹12K Cr',   capNum: 12000 },
  'Information Technology':             { exchange: 'NSE/BSE', cap: '₹14.2L Cr', capNum: 1420000 },
  'Healthcare':                         { exchange: 'NSE/BSE', cap: '₹2.9L Cr',  capNum: 290000 },
  'Consumer Durables':                  { exchange: 'NSE/BSE', cap: '₹88K Cr',   capNum: 88000 },
  'Realty':                             { exchange: 'NSE/BSE', cap: '₹1.1L Cr',  capNum: 110000 },
  'Chemicals':                          { exchange: 'NSE/BSE', cap: '₹98K Cr',   capNum: 98000 },
  'Automobile and Auto Components':     { exchange: 'NSE/BSE', cap: '₹3.7L Cr',  capNum: 370000 },
  'Fast Moving Consumer Goods':         { exchange: 'NSE/BSE', cap: '₹5.5L Cr',  capNum: 550000 },
  'Construction':                       { exchange: 'NSE/BSE', cap: '₹1.4L Cr',  capNum: 140000 },
  'Consumer Services':                  { exchange: 'NSE',     cap: '₹62K Cr',   capNum: 62000 },
  'Textiles':                           { exchange: 'NSE/BSE', cap: '₹52K Cr',   capNum: 52000 },
  'Telecommunication':                  { exchange: 'NSE/BSE', cap: '₹4.8L Cr',  capNum: 480000 },
  'Media, Entertainment & Publication': { exchange: 'NSE/BSE', cap: '₹38K Cr',   capNum: 38000 },
  'Utilities':                          { exchange: 'NSE/BSE', cap: '₹3.5L Cr',  capNum: 350000 },
}

/* Flat mock metrics for the old tile-based view */
export const MOCK_DATA: Record<string, Record<string, string>> = {}
Object.keys(CO_BASE).forEach(co => {
  const d = getAnnualData(co)['2025'] ?? {}
  MOCK_DATA[co] = {
    Revenue: `${((d.Sales as number) / 100).toFixed(0)} Cr`,
    'Net Profit': `${((d['Net Profit'] as number) / 100).toFixed(0)} Cr`,
    'EPS in Rs': String(d['EPS in Rs'] ?? '—'),
    'OPM %': `${d['OPM %'] ?? '—'}%`,
    'Total Assets': `${((d['Total Assets'] as number) / 100).toFixed(0)} Cr`,
  }
})
