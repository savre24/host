import PageTitle from '@/components/PageTitle';
import AdminDomainsClient from './AdminDomainsClient';
import prisma from '@/lib/prisma';

export const metadata = {
  title: 'Domain Management & ResellerClub Pricing',
};

export default async function AdminDomainsPage() {
  let domainServices = [];
  let clients = [];

  try {
    const [fetchedServices, fetchedClients] = await Promise.all([
      prisma.clientService.findMany({
        where: {
          OR: [
            { product: { category: 'DOMAIN' } },
            { domainDetail: { isNot: null } },
          ],
        },
        include: {
          client: {
            select: {
              id: true,
              companyName: true,
              user: { select: { name: true, email: true } },
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              category: true,
              defaultPrice: true,
              renewalPrice: true,
            },
          },
          domainDetail: true,
        },
        orderBy: { expiryDate: 'asc' },
      }),
      prisma.clientProfile.findMany({
        include: {
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    domainServices = fetchedServices;
    clients = fetchedClients;
  } catch (err) {
    console.warn('Could not fetch domain services or clients:', err?.message);
  }

  return (
    <>
      <PageTitle title="Domain Management" subTitle="ResellerClub Integration" />
      <AdminDomainsClient 
        initialClientServices={domainServices} 
        clients={clients} 
      />
    </>
  );
}
