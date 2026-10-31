import type { Continent } from '../game/types'

export interface CountryInfo { code: string; num: string; name: string; continent: Continent }

// ISO 3166-1 alpha-2 + numeric (numeric matches the Natural Earth / world-atlas border data).
const RAW: [string, string, string, Continent][] = [
  ['MA', '504', 'Morocco', 'Africa'], ['EG', '818', 'Egypt', 'Africa'], ['ZA', '710', 'South Africa', 'Africa'],
  ['NA', '516', 'Namibia', 'Africa'], ['MG', '450', 'Madagascar', 'Africa'], ['TZ', '834', 'Tanzania', 'Africa'],
  ['KE', '404', 'Kenya', 'Africa'], ['GH', '288', 'Ghana', 'Africa'], ['NG', '566', 'Nigeria', 'Africa'],
  ['ET', '231', 'Ethiopia', 'Africa'], ['SN', '686', 'Senegal', 'Africa'], ['TN', '788', 'Tunisia', 'Africa'],
  ['DZ', '012', 'Algeria', 'Africa'], ['BW', '072', 'Botswana', 'Africa'], ['ZW', '716', 'Zimbabwe', 'Africa'],
  ['UG', '800', 'Uganda', 'Africa'], ['MZ', '508', 'Mozambique', 'Africa'], ['CI', '384', "Côte d'Ivoire", 'Africa'],
  ['CM', '120', 'Cameroon', 'Africa'], ['ZM', '894', 'Zambia', 'Africa'], ['RW', '646', 'Rwanda', 'Africa'],
  ['JP', '392', 'Japan', 'Asia'], ['VN', '704', 'Vietnam', 'Asia'], ['IN', '356', 'India', 'Asia'],
  ['TH', '764', 'Thailand', 'Asia'], ['ID', '360', 'Indonesia', 'Asia'], ['KR', '410', 'South Korea', 'Asia'],
  ['TR', '792', 'Türkiye', 'Asia'], ['NP', '524', 'Nepal', 'Asia'], ['CN', '156', 'China', 'Asia'],
  ['JO', '400', 'Jordan', 'Asia'], ['AE', '784', 'United Arab Emirates', 'Asia'], ['MY', '458', 'Malaysia', 'Asia'],
  ['PH', '608', 'Philippines', 'Asia'], ['LA', '418', 'Laos', 'Asia'], ['KH', '116', 'Cambodia', 'Asia'],
  ['MM', '104', 'Myanmar', 'Asia'], ['LK', '144', 'Sri Lanka', 'Asia'], ['BD', '050', 'Bangladesh', 'Asia'],
  ['PK', '586', 'Pakistan', 'Asia'], ['IR', '364', 'Iran', 'Asia'], ['SA', '682', 'Saudi Arabia', 'Asia'],
  ['OM', '512', 'Oman', 'Asia'], ['IL', '376', 'Israel', 'Asia'], ['TW', '158', 'Taiwan', 'Asia'],
  ['MN', '496', 'Mongolia', 'Asia'], ['UZ', '860', 'Uzbekistan', 'Asia'], ['BT', '064', 'Bhutan', 'Asia'],
  ['NO', '578', 'Norway', 'Europe'], ['NL', '528', 'Netherlands', 'Europe'], ['PT', '620', 'Portugal', 'Europe'],
  ['GR', '300', 'Greece', 'Europe'], ['IS', '352', 'Iceland', 'Europe'], ['IT', '380', 'Italy', 'Europe'],
  ['AT', '040', 'Austria', 'Europe'], ['GB', '826', 'United Kingdom', 'Europe'], ['CZ', '203', 'Czechia', 'Europe'],
  ['ES', '724', 'Spain', 'Europe'], ['FR', '250', 'France', 'Europe'], ['DE', '276', 'Germany', 'Europe'],
  ['CH', '756', 'Switzerland', 'Europe'], ['SE', '752', 'Sweden', 'Europe'], ['DK', '208', 'Denmark', 'Europe'],
  ['FI', '246', 'Finland', 'Europe'], ['BE', '056', 'Belgium', 'Europe'], ['IE', '372', 'Ireland', 'Europe'],
  ['PL', '616', 'Poland', 'Europe'], ['HU', '348', 'Hungary', 'Europe'], ['HR', '191', 'Croatia', 'Europe'],
  ['SI', '705', 'Slovenia', 'Europe'], ['RO', '642', 'Romania', 'Europe'], ['BG', '100', 'Bulgaria', 'Europe'],
  ['ME', '499', 'Montenegro', 'Europe'], ['AL', '008', 'Albania', 'Europe'], ['CY', '196', 'Cyprus', 'Europe'],
  ['MT', '470', 'Malta', 'Europe'], ['RU', '643', 'Russia', 'Europe'], ['EE', '233', 'Estonia', 'Europe'],
  ['US', '840', 'United States', 'North America'], ['CA', '124', 'Canada', 'North America'],
  ['MX', '484', 'Mexico', 'North America'], ['CU', '192', 'Cuba', 'North America'],
  ['GT', '320', 'Guatemala', 'North America'], ['CR', '188', 'Costa Rica', 'North America'],
  ['PA', '591', 'Panama', 'North America'], ['HN', '340', 'Honduras', 'North America'],
  ['BZ', '084', 'Belize', 'North America'], ['DO', '214', 'Dominican Republic', 'North America'],
  ['JM', '388', 'Jamaica', 'North America'],
  ['PE', '604', 'Peru', 'South America'], ['CL', '152', 'Chile', 'South America'], ['BO', '068', 'Bolivia', 'South America'],
  ['AR', '032', 'Argentina', 'South America'], ['BR', '076', 'Brazil', 'South America'], ['CO', '170', 'Colombia', 'South America'],
  ['EC', '218', 'Ecuador', 'South America'], ['UY', '858', 'Uruguay', 'South America'], ['PY', '600', 'Paraguay', 'South America'],
  ['VE', '862', 'Venezuela', 'South America'],
  ['AU', '036', 'Australia', 'Oceania'], ['NZ', '554', 'New Zealand', 'Oceania'], ['FJ', '242', 'Fiji', 'Oceania'],
  ['PG', '598', 'Papua New Guinea', 'Oceania'],
]

export const COUNTRIES: Record<string, CountryInfo> = Object.fromEntries(
  RAW.map(([code, num, name, continent]) => [code, { code, num, name, continent }]),
)
export const BY_NUM: Record<string, CountryInfo> = Object.fromEntries(RAW.map(([code, num]) => [num, COUNTRIES[code]]))

export const CONTINENTS: Continent[] = ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania']

export const countryName = (code: string | null | undefined) => (code && COUNTRIES[code]?.name) || code || 'Unknown'
export const continentOf = (code: string) => COUNTRIES[code]?.continent
