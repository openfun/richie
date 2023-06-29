import { defineMessages, FormattedMessage, FormattedNumber } from 'react-intl';
import { Button } from '@openfun/cunningham-react';
import { Priority } from 'types';
import type * as Joanie from 'types/Joanie';
import CourseRunsList from './CourseRunsList';

const messages = defineMessages({
  includingVAT: {
    defaultMessage: 'including VAT',
    description: 'Text displayed next to the price to mention this is the price including VAT.',
    id: 'components.SaleTunnelStepValidation.includingVAT',
  },
  proceedToPayment: {
    defaultMessage: 'Proceed to payment',
    description: 'CTA to go to payment step',
    id: 'components.SaleTunnelStepValidation.proceedToPayment',
  },
});

interface SaleTunnelStepValidationProps {
  next: () => void;
  product: Joanie.Product;
}

export const SaleTunnelStepValidation = ({ product, next }: SaleTunnelStepValidationProps) => {
  const isOpenedCourseRun = (courseRun: Joanie.CourseRun) =>
    courseRun.state.priority <= Priority.FUTURE_NOT_YET_OPEN;

  return (
    <section className="SaleTunnelStepValidation">
      <header className="SaleTunnelStepValidation__header">
        <h2 className="SaleTunnelStepValidation__title">{product.title}</h2>
        <strong className="h4 SaleTunnelStepValidation__price">
          <FormattedNumber
            value={product.price}
            style="currency"
            currency={product.price_currency}
          />
          &nbsp;
          <FormattedMessage {...messages.includingVAT} />
        </strong>
      </header>
      <ol className="SaleTunnelStepValidation__product-detail-list">
        {product.target_courses.map((course) => (
          <li
            key={`SaleTunnelStepValidation__product-detail-row--${course.code}`}
            className="SaleTunnelStepValidation__product-detail-row product-detail-row product-detail-row--course"
          >
            <span className="product-detail-row__icon">
              <svg aria-hidden="true">
                <use href="#icon-check" />
              </svg>
            </span>
            <h3 className="product-detail-row__title">{course.title}</h3>
            <CourseRunsList courseRuns={course.course_runs.filter(isOpenedCourseRun)} />
          </li>
        ))}
        {product.certificate_definition ? (
          <li className="SaleTunnelStepValidation__product-detail-row product-detail-row product-detail-row--certificate">
            <span className="product-detail-row__icon product-detail-row__icon--big">
              <svg aria-hidden="true">
                <use href="#icon-certificate" />
              </svg>
            </span>
            <h3 className="product-detail-row__title">{product.certificate_definition.title}</h3>
            {product.certificate_definition.description ? (
              <p className="product-detail-row__content">
                {product.certificate_definition.description}
              </p>
            ) : null}
          </li>
        ) : null}
      </ol>
      <footer className="SaleTunnelStepValidation__footer">
        <Button onClick={next}>
          <FormattedMessage {...messages.proceedToPayment} />
        </Button>
      </footer>
    </section>
  );
};
