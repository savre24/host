import React from 'react';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import ComponentContainerCard from '@/components/ComponentContainerCard';
import PageTitle from '@/components/PageTitle';
import { Col, Row } from 'react-bootstrap';
import CreateTicketForm from './CreateTicketForm';
import { getClientServices } from '@/app/actions/client-portal';

export const metadata = {
  title: 'Open Support Ticket',
};

const CreateTicketPage = async () => {
  const session = await getServerSession(options);
  const { data: services } = await getClientServices(session?.user?.id);

  return (
    <>
      <PageTitle title="Open Ticket" subTitle="Support" />
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <ComponentContainerCard 
            title="Submit a Support Request" 
            description="If you can't find a solution to your problem, you can submit a ticket by selecting the appropriate department below."
          >
            <CreateTicketForm userId={session?.user?.id} services={services || []} />
          </ComponentContainerCard>
        </Col>
      </Row>
    </>
  );
};

export default CreateTicketPage;
