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
  // Inclusive of 18% GST (matching ResellerClub Control Panel)
  registerCostWithTax: number;
  renewCostWithTax: number;
  transferCostWithTax: number;
  taxRate: number;
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

  const TAX_RATE = 0.18; // 18% GST for Indian resellers
  const pricing: Record<string, TldWholesalePricing> = {};

  for (const [tld, key] of Object.entries(TLD_MAPPING)) {
    const item = data[key];
    if (item) {
      const reg = parseFloat(item.addnewdomain?.['1'] || '0');
      const ren = parseFloat(item.renewdomain?.['1'] || '0');
      const trn = parseFloat(item.addtransferdomain?.['1'] || '0');

      pricing[tld] = {
        tld,
        productKey: key,
        registerCost: reg,
        renewCost: ren,
        transferCost: trn,
        registerCostWithTax: parseFloat((reg * (1 + TAX_RATE)).toFixed(2)),
        renewCostWithTax: parseFloat((ren * (1 + TAX_RATE)).toFixed(2)),
        transferCostWithTax: parseFloat((trn * (1 + TAX_RATE)).toFixed(2)),
        taxRate: 18,
        currency: 'INR',
      };
    }
  }

  return pricing;
}

/**
 * Ensures a ResellerClub customer and default contact exist for a ClientProfile
 */
export async function getOrCreateResellerCustomer(clientProfile: any): Promise<{ customerId: number; contactId: number }> {
  const email = clientProfile.user?.email || `client-${clientProfile.id}@hostingspaceindia.com`;
  const name = clientProfile.user?.name || clientProfile.companyName || 'Valued Client';
  const company = clientProfile.companyName || name;
  const rawPhone = clientProfile.phone ? String(clientProfile.phone).replace(/[^0-9]/g, '') : '9876543210';
  const phone = rawPhone.length >= 10 ? rawPhone.slice(-10) : '9876543210';
  const phoneCc = '91';
  const address = clientProfile.address || 'Hosting Space India Main Road';
  const city = 'Chennai';
  const state = 'Tamil Nadu';
  const country = 'IN';
  const zipcode = '600001';

  let customerId: number | null = null;
  try {
    const details = await resellerClubRequest<any>(
      '/customers/details.json',
      'GET',
      { username: email }
    );
    if (details && (details['customerid'] || details.customerid)) {
      customerId = Number(details['customerid'] || details.customerid);
    }
  } catch (e) {
    // Not found, will signup
  }

  if (!customerId) {
    const randomPassword = 'Cust' + Math.random().toString(36).substring(2, 8) + '!9A';
    customerId = await createResellerCustomer({
      username: email,
      passwd: randomPassword,
      name,
      company,
      address1: address,
      city,
      state,
      country,
      zipcode,
      phoneCc,
      phone,
    });
  }

  // Get or create default contact
  let contactId: number | null = null;
  try {
    const defaultContact = await resellerClubRequest<any>(
      '/contacts/default.json',
      'GET',
      { 'customer-id': String(customerId), type: 'Contact' }
    );
    if (defaultContact && (defaultContact['contactid'] || defaultContact.contactid)) {
      contactId = Number(defaultContact['contactid'] || defaultContact.contactid);
    }
  } catch (e) {
    // create contact
  }

  if (!contactId) {
    contactId = await createResellerContact({
      customerId,
      name,
      company,
      email,
      address1: address,
      city,
      state,
      country,
      zipcode,
      phoneCc,
      phone,
      type: 'Contact',
    });
  }

  return { customerId, contactId };
}

/**
 * Execute live domain registration with ResellerClub API
 */
export async function executeLiveDomainRegistration({
  domainName,
  years = 1,
  nameservers = ['ns1.hostingspaceindia.com', 'ns2.hostingspaceindia.com'],
  clientProfile,
}: {
  domainName: string;
  years?: number;
  nameservers?: string[];
  clientProfile: any;
}) {
  try {
    const { customerId, contactId } = await getOrCreateResellerCustomer(clientProfile);

    const result: any = await registerDomain({
      domainName,
      years,
      nameservers: nameservers.length > 0 ? nameservers : ['ns1.hostingspaceindia.com', 'ns2.hostingspaceindia.com'],
      customerId,
      contactId,
      protectPrivacy: false,
    });

    const orderId = result?.entityid || result?.['entityid'] || result?.description || 'SUCCESS';
    return { success: true, orderId, result };
  } catch (error: any) {
    const message = error.message || 'Domain registration failed on ResellerClub API';
    const isBalanceError = message.toLowerCase().includes('fund') || 
                           message.toLowerCase().includes('balance') || 
                           message.toLowerCase().includes('money') || 
                           message.toLowerCase().includes('credit');
    return { success: false, error: message, isBalanceError };
  }
}

