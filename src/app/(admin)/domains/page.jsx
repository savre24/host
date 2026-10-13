import PageTitle from '@/components/PageTitle';
import AdminDomainsClient from './AdminDomainsClient';
import prisma from '@/lib/prisma';

export const metadata = {
  title: 'Domain Management & ResellerClub Pricing',
};

export default async function AdminDomainsPage() {
  let domainServices = [];
  try {
    domainServices = await prisma.clientService.findMany({
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
    });
  } catch (err) {
    console.warn('Could not fetch domain services (using empty list):', err.message);
  }

  return (
    <>
      <PageTitle title="Domain Management" subTitle="ResellerClub Integration" />
      <AdminDomainsClient initialClientServices={domainServices} />
    </>
  );
}
