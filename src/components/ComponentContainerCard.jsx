import { Card, CardBody, CardHeader } from 'react-bootstrap';
const ComponentContainerCard = ({
  title,
  description,
  action,
  children
}) => {
  return <Card>
      <CardHeader className="border-0 border-bottom border-dashed d-flex justify-content-between align-items-center">
        <h4 className="header-title mb-0">{title}</h4>
        {action && <div>{action}</div>}
      </CardHeader>
      <CardBody>
        {description && <p className="text-muted">{description}</p>}
        {children}
      </CardBody>
    </Card>;
};
export default ComponentContainerCard;