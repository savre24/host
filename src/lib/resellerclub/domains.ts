import { resellerClubRequest } from './client';

export interface ResellerCustomerData {
  username: string; // email
  passwd: string;
  name: string;
  company: string;
  address1: string;
  city: string;
  state: string;
  country: string; // e.g. "IN", "US"
  zipcode: string;
  phoneCc: string; // e.g. "91"
  phone: string;
  langPref?: string;
}

export interface ResellerContactData {
  customerId: number | string;
  name: string;
  company: string;
  email: string;
  address1: string;
  city: string;
  state: string;
  country: string;
  zipcode: string;
  phoneCc: string;
  phone: string;
  type?: string; // 'Contact'
}

export interface RegisterDomainParams {
  domainName: string;
  years?: number;
  nameservers: string[];
  customerId: number | string;
  contactId: number | string;
  protectPrivacy?: boolean;
}

/**
 * Create or register a customer in ResellerClub
 * Returns customer-id (integer)
 */
export async function createResellerCustomer(data: ResellerCustomerData): Promise<number> {
  const result = await resellerClubRequest<number | string>(
    '/customers/signup.json',
    'POST',
    {
      username: data.username,
      passwd: data.passwd,
      name: data.name,
      company: data.company || 'Individual',
      'address-line-1': data.address1,
      city: data.city,
      state: data.state,
      country: data.country,
      zipcode: data.zipcode,
      'phone-cc': data.phoneCc,
      phone: data.phone,
      'lang-pref': data.langPref || 'en',
    }
  );

  return Number(result);
}

/**
 * Add a default contact record for the customer
 * Returns contact-id (integer)
 */
export async function createResellerContact(data: ResellerContactData): Promise<number> {
  const result = await resellerClubRequest<number | string>(
    '/contacts/add.json',
    'POST',
    {
      name: data.name,
      company: data.company || 'Individual',
      email: data.email,
      'address-line-1': data.address1,
      city: data.city,
      state: data.state,
      country: data.country,
      zipcode: data.zipcode,
      'phone-cc': data.phoneCc,
      phone: data.phone,
      'customer-id': String(data.customerId),
      type: data.type || 'Contact',
    }
  );

  return Number(result);
}

/**
 * Register a new domain name
 */
export async function registerDomain(params: RegisterDomainParams) {
  const result = await resellerClubRequest(
    '/domains/register.json',
    'POST',
    {
      'domain-name': params.domainName,
      years: params.years || 1,
      ns: params.nameservers,
      'customer-id': String(params.customerId),
      'reg-contact-id': String(params.contactId),
      'admin-contact-id': String(params.contactId),
      'tech-contact-id': String(params.contactId),
      'billing-contact-id': String(params.contactId),
      'invoice-option': 'NoInvoice',
      'protect-privacy': params.protectPrivacy ? 'true' : 'false',
    }
  );

  return result;
}

/**
 * Modify NameServers of a domain
 */
export async function modifyNameservers(orderId: string | number, nameservers: string[]) {
  const result = await resellerClubRequest(
    '/domains/modify-ns.json',
    'POST',
    {
      'order-id': String(orderId),
      ns: nameservers,
    }
  );

  return result;
}

/**
 * Get details of a registered domain by order ID
 */
export async function getDomainDetails(orderId: string | number) {
  const result = await resellerClubRequest(
    '/domains/details.json',
    'GET',
    {
      'order-id': String(orderId),
      options: 'All',
    }
  );

  return result;
}

/**
 * Get details of a registered domain by Domain Name
 */
export async function getDomainDetailsByName(domainName: string) {
  const result = await resellerClubRequest(
    '/domains/details-by-name.json',
    'GET',
    {
      'domain-name': domainName,
      options: 'All',
    }
  );

  return result;
}

/**
 * Renew an existing domain order
 */
export async function renewDomain(params: {
  orderId: string | number;
  years?: number;
  expDate: number; // Unix timestamp in seconds
}) {
  const result = await resellerClubRequest(
    '/domains/renew.json',
    'POST',
    {
      'order-id': String(params.orderId),
      years: params.years || 1,
      'exp-date': String(params.expDate),
      'auto-renew': 'false',
      'invoice-option': 'NoInvoice',
    }
  );

  return result;
}

export interface TldWholesalePricing {
  tld: string;
  productKey: string;
  registerCost: number;
  renewCost: number;
  transferCost: number;
  currency: string;
}

/**
 * Fetch wholesale cost prices from ResellerClub for supported TLDs
 */
export async function getResellerWholesalePricing(): Promise<Record<string, TldWholesalePricing>> {
  const data = await resellerClubRequest(
    '/products/reseller-cost-price.json',
    'GET'
  );

  const TLD_MAPPING: Record<string, string> = {
    'com': 'domcno',
    'in': 'dotin',
    'co.in': 'thirdleveldotin',
    'net': 'dotnet',
    'org': 'domorg',
    'online': 'dotonline',
    'biz': 'dombiz',
    'info': 'dominfo',
  };

  const pricing: Record<string, TldWholesalePricing> = {};

  for (const [tld, key] of Object.entries(TLD_MAPPING)) {
    const item = data[key];
    if (item) {
      pricing[tld] = {
        tld,
        productKey: key,
        registerCost: parseFloat(item.addnewdomain?.['1'] || '0'),
        renewCost: parseFloat(item.renewdomain?.['1'] || '0'),
        transferCost: parseFloat(item.addtransferdomain?.['1'] || '0'),
        currency: 'INR',
      };
    }
  }

  return pricing;
}

