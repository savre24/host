export const MENU_ITEMS = [
  {
    key: 'navigation',
    label: 'Navigation',
    isTitle: true,
  },
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: 'tabler:dashboard',
    url: '/dashboard',
  },
  {
    key: 'clients',
    label: 'Clients',
    icon: 'tabler:users',
    url: '/clients',
  },
  {
    key: 'products-services',
    label: 'Products & Services',
    icon: 'tabler:briefcase',
    url: '/products',
  },
  {
    key: 'assigned-services',
    label: 'Client Services',
    icon: 'tabler:device-imac',
    url: '/services',
  },
  {
    key: 'renewals',
    label: 'Renewals',
    icon: 'tabler:repeat',
    url: '/renewals',
  },
  {
    key: 'billing',
    label: 'Billing',
    icon: 'tabler:file-invoice',
    children: [
      {
        key: 'invoices',
        label: 'Invoices',
        url: '/invoices',
        parentKey: 'billing',
      },
      {
        key: 'quotations',
        label: 'Quotations',
        url: '/quotations',
        parentKey: 'billing',
      },
    ],
  },
  {
    key: 'payments',
    label: 'Payments',
    icon: 'tabler:cash',
    url: '/payments',
  },
  {
    key: 'support',
    label: 'Support Tickets',
    icon: 'tabler:headset',
    url: '/support',
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp API',
    icon: 'tabler:brand-whatsapp',
    url: '/settings/whatsapp',
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: 'tabler:settings',
    url: '/settings',
  },
];

export const HORIZONTAL_MENU_ITEM = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: 'tabler:dashboard',
    url: '/client/dashboard',
  },
  {
    key: 'my-services',
    label: 'My Services',
    icon: 'tabler:briefcase',
    url: '/client/services',
  },
  {
    key: 'renewals',
    label: 'Renewals',
    icon: 'tabler:repeat',
    url: '/client/renewals',
  },
  {
    key: 'billing',
    label: 'Billing',
    icon: 'tabler:file-invoice',
    children: [
      {
        key: 'invoices',
        label: 'Invoices',
        url: '/client/invoices',
        parentKey: 'billing',
      },
      {
        key: 'quotations',
        label: 'Quotations',
        url: '/client/quotations',
        parentKey: 'billing',
      },
    ],
  },
  {
    key: 'payments',
    label: 'Payments',
    icon: 'tabler:cash',
    url: '/client/payments',
  },
  {
    key: 'support',
    label: 'Support Tickets',
    icon: 'tabler:headset',
    url: '/client/support',
  },
];