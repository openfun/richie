import { FormattedMessage, useIntl, defineMessages } from 'react-intl';
import { Button } from '@openfun/cunningham-react';
import classNames from 'classnames';
import { CourseLight, CredentialOrder, Product } from 'types/Joanie';
import { Icon, IconTypeEnum } from 'components/Icon';
import { CoursesHelper } from 'utils/CoursesHelper';
import { useCertificate } from 'hooks/useCertificates';
import { Spinner } from 'components/Spinner';
import { DashboardSubItem } from 'widgets/Dashboard/components/DashboardItem/DashboardSubItem';
import { DashboardItemCertificate } from 'widgets/Dashboard/components/DashboardItem/Certificate';
import { RouterButton } from 'widgets/Dashboard/components/RouterButton';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRouteMessages';
import { getDashboardRoutePath } from 'widgets/Dashboard/utils/dashboardRoutes';
import { useCourseProduct } from 'hooks/useCourseProducts';
import { OrderHelper } from 'utils/OrderHelper';
import ContractStatus from 'components/ContractStatus';
import SignContractButton from 'components/SignContractButton';
import { AddressView } from 'components/Address';
import { DashboardSubItemsList } from '../DashboardSubItemsList';
import { DashboardItemCourseEnrolling } from '../CourseEnrolling';
import { DashboardItem } from '../index';
import { DashboardItemContract } from '../Contract';
import OrderStateLearnerMessage from './OrderStateLearnerMessage';

const messages = defineMessages({
  accessCourse: {
    id: 'components.DashboardItemOrder.gotoCourse',
    description: 'Button that redirects to the order details',
    defaultMessage: 'View details',
  },
  loadingCertificate: {
    id: 'components.DashboardItemOrder.loadingCertificate',
    description: 'Accessible label displayed while certificate is being fetched on the dashboard.',
    defaultMessage: 'Loading certificate...',
  },
  syllabusLinkLabel: {
    id: 'components.DashboardItemOrder.syllabusLinkLabel',
    description: 'Syllabus link label on order details',
    defaultMessage: 'Go to syllabus',
  },
  contactDescription: {
    id: 'components.DashboardItemOrder.contactDescription',
    description: 'Description of the contact information for the organization',
    defaultMessage: 'Your training reference is {name} - {email}.',
  },
  contactButton: {
    id: 'components.DashboardItemOrder.contactButton',
    description: 'Button to contact the organization',
    defaultMessage: 'Contact',
  },
  organizationHeader: {
    id: 'components.DashboardItemOrder.organizationHeader',
    description: 'Header of the organization section',
    defaultMessage: 'This training is provided by',
  },
  organizationLogoAlt: {
    id: 'components.DashboardItemOrder.organizationLogoAlt',
    description: 'Alt text for the organization logo',
    defaultMessage: 'Logo of the organization',
  },
  trainingContractTitle: {
    id: 'components.DashboardItemOrder.trainingContractTitle',
    description: 'Title of the training contract section',
    defaultMessage: 'Training contract',
  },
  organizationMailContactLabel: {
    id: 'components.DashboardItemOrder.organizationMailContactLabel',
    description: 'Label for the organization mail contact',
    defaultMessage: 'Email',
  },
  organizationPhoneContactLabel: {
    id: 'components.DashboardItemOrder.organizationPhoneContactLabel',
    description: 'Label for the organization phone contact',
    defaultMessage: 'Phone',
  },
  organizationDpoContactLabel: {
    id: 'components.DashboardItemOrder.organizationDpoContactLabel',
    description: 'Label for the organization DPO contact',
    defaultMessage: 'Data protection email',
  },
});

interface DashboardItemOrderProps {
  order: CredentialOrder;
  showDetailsButton?: boolean;
  showCertificate?: boolean;
  writable?: boolean;
}

interface DashboardItemOrderCertificateProps {
  order: CredentialOrder;
  product: Product;
}

const DashboardItemOrderCertificate = ({ order, product }: DashboardItemOrderCertificateProps) => {
  if (!order.certificate_id) {
    return (
      <DashboardItemCertificate
        certificateDefinition={product.certificate_definition}
        productType={product.type}
        mode="compact"
      />
    );
  }
  const certificate = useCertificate(order.certificate_id);
  return (
    <>
      {certificate.states.fetching && (
        <Spinner aria-labelledby="loading-certificate">
          <span id="loading-certificate">
            <FormattedMessage {...messages.loadingCertificate} />
          </span>
        </Spinner>
      )}
      {certificate.item && (
        <DashboardItemCertificate
          certificate={certificate.item}
          productType={product.type}
          mode="compact"
        />
      )}
    </>
  );
};

export const DashboardItemOrder = ({
  order,
  showDetailsButton = true,
  showCertificate,
  writable = false,
}: DashboardItemOrderProps) => {
  const course = order.course as CourseLight;

  const intl = useIntl();
  const { item: courseProductRelation } = useCourseProduct({
    product_id: order.product_id,
    course_id: course.code,
  });
  const { product } = courseProductRelation || {};
  const needsSignature = OrderHelper.orderNeedsSignature(order, product?.contract_definition);
  const getRoutePath = getDashboardRoutePath(useIntl());

  return (
    <div className="dashboard-item-order">
      <DashboardItem
        data-testid={`dashboard-item-order-${order.id}`}
        title={product?.title ?? ''}
        code={'Ref. ' + course.code}
        imageUrl={course.cover?.src}
        more={
          <li>
            <a className="selector__list__link" href={`/redirects/courses/${course.code}`}>
              <FormattedMessage {...messages.syllabusLinkLabel} />
            </a>
          </li>
        }
        footer={
          <>
            <div className="dashboard-item-order__footer">
              <div className="dashboard-item__block__status">
                <Icon name={IconTypeEnum.SCHOOL} />
                <OrderStateLearnerMessage
                  order={order}
                  contractDefinition={product?.contract_definition}
                />
              </div>
              {showDetailsButton && (
                <RouterButton
                  size="small"
                  className="dashboard-item__button"
                  href={getRoutePath(LearnerDashboardPaths.ORDER, { orderId: order.id })}
                  data-testid="dashboard-item-order__button"
                >
                  {intl.formatMessage(messages.accessCourse)}
                </RouterButton>
              )}
            </div>
            {!writable && needsSignature && (
              <DashboardItemContract
                key={`DashboardItemOrderContract_${order.id}`}
                title={product.title}
                order={order}
                contract_definition={product?.contract_definition!}
                contract={order.contract}
                writable={writable}
                mode="compact"
              />
            )}
          </>
        }
      >
        <DashboardSubItemsList
          subItems={order.target_courses?.map((targetCourse) => (
            <DashboardSubItem
              title={targetCourse.title}
              footer={
                <DashboardItemCourseEnrolling
                  writable={writable}
                  course={targetCourse}
                  order={order}
                  product={product}
                  activeEnrollment={CoursesHelper.findActiveCourseEnrollmentInOrder(
                    targetCourse,
                    order,
                  )}
                  notEnrolledUrl={getRoutePath(LearnerDashboardPaths.ORDER, {
                    orderId: order.id,
                  })}
                  hideEnrollButtons={needsSignature}
                />
              }
            />
          ))}
        />
      </DashboardItem>
      {showCertificate && !!product?.certificate_definition && (
        <DashboardItemOrderCertificate order={order} product={product} />
      )}
      {writable && <OrganizationBlock order={order} product={product} />}
    </div>
  );
};

const OrganizationBlock = ({ order, product }: { order: CredentialOrder; product: Product }) => {
  const { organization } = order;
  if (!organization) {
    return null;
  }

  const showContactsBlock =
    organization.contact_email || organization.contact_phone || organization.dpo_email;

  return (
    <div className="dashboard-splitted-card mt-s" data-testid="organization-block">
      <div className="dashboard-splitted-card__column order-organization__caption">
        <div className="dashboard-item-order__organization">
          <div className="dashboard-item-order__organization__header">
            <FormattedMessage {...messages.organizationHeader} />
          </div>
          <div
            className="dashboard-item-order__organization__logo"
            style={{
              backgroundImage: `url(${organization.logo?.src})`,
            }}
          />
          <div className="dashboard-item-order__organization__name">{organization.title}</div>
        </div>
      </div>
      <div className="dashboard-splitted-card__separator order-organization__separator" />
      <div className="dashboard-splitted-card__column order-organization__items">
        <ContractItem order={order} product={product} />
        {showContactsBlock && (
          <div className="dashboard-splitted-card__item">
            <div className="dashboard-splitted-card__item__title">Contacts</div>
            <div className="dashboard-splitted-card__item__description">
              {organization.contact_email && (
                <div className="organization-block__contact__item">
                  <FormattedMessage {...messages.organizationMailContactLabel} />
                  <Button
                    size="small"
                    color="tertiary"
                    href={'mailto:' + (organization.contact_email ?? '')}
                  >
                    {organization.contact_email}
                  </Button>
                </div>
              )}
              {organization.contact_phone && (
                <div className="organization-block__contact__item">
                  <FormattedMessage {...messages.organizationPhoneContactLabel} />
                  <Button
                    size="small"
                    color="tertiary"
                    href={'tel:' + (organization.contact_phone ?? '')}
                  >
                    {organization.contact_phone}
                  </Button>
                </div>
              )}
              {organization.dpo_email && (
                <div className="organization-block__contact__item">
                  <FormattedMessage {...messages.organizationDpoContactLabel} />
                  <Button
                    size="small"
                    color="tertiary"
                    href={'mailto:' + (organization.dpo_email ?? '')}
                  >
                    {organization.dpo_email}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
        {organization.address && (
          <div className="dashboard-splitted-card__item dashboard-splitted-card__item__address">
            <div className="dashboard-splitted-card__item__title">Address</div>
            <div className="dashboard-splitted-card__item__description">
              <AddressView address={organization.address} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ContractItem = ({ product, order }: { order: CredentialOrder; product: Product }) => {
  if (!product?.contract_definition) {
    return;
  }

  const needsSignature = OrderHelper.orderNeedsSignature(order, product.contract_definition);
  return (
    <div
      id={`dashboard-item-contract-${order.id}`}
      className="dashboard-splitted-card__item"
      data-testid={`dashboard-item-contract-${order.id}`}
    >
      <div
        className={classNames('dashboard-splitted-card__item__title', {
          'dashboard-splitted-card__item__title--dot': needsSignature,
        })}
      >
        <span>
          <FormattedMessage {...messages.trainingContractTitle} />
        </span>
      </div>
      <div className="dashboard-splitted-card__item__description">
        <ContractStatus contract={order.contract} />
      </div>
      <div className="dashboard-splitted-card__item__actions">
        <SignContractButton
          order={order}
          contract={order.contract}
          writable={true}
          className="dashboard-item__button"
        />
      </div>
    </div>
  );
};
