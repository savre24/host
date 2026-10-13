import PageTitle from '@/components/PageTitle';
import DomainSearchForm from './DomainSearchForm';

export const metadata = {
  title: 'Register New Domain | Client Portal',
};

export default function ClientDomainSearchPage() {
  return (
    <>
      <PageTitle title="Register a Domain" subTitle="Domain Services" />
      <DomainSearchForm />
    </>
  );
}
