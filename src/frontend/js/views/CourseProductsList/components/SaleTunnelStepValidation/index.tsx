import { defineMessages, FormattedMessage, FormattedNumber } from 'react-intl';
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
        <h3 className="SaleTunnelStepValidation__title">{product.title}</h3>
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
            <h4 className="product-detail-row__title">{course.title}</h4>
            <CourseRunsList courseRuns={course.course_runs.filter(isOpenedCourseRun)} />
          </li>
        ))}
        {product.certificate ? (
          <li className="SaleTunnelStepValidation__product-detail-row product-detail-row product-detail-row--certificate">
            <span className="product-detail-row__icon product-detail-row__icon--big">
              <svg aria-hidden="true">
                <use href="#icon-certificate" />
              </svg>
            </span>
            <h4 className="product-detail-row__title">{product.certificate.title}</h4>
            {product.certificate.description ? (
              <p className="product-detail-row__content">{product.certificate.description}</p>
            ) : null}
          </li>
        ) : null}
      </ol>
      <footer className="SaleTunnelStepValidation__footer">
        <button className="button button-sale--primary" onClick={next}>
          <FormattedMessage {...messages.proceedToPayment} />
        </button>
      </footer>
    </section>
  );
};
