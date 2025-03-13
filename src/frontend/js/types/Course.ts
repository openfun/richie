import { CourseState } from 'types';
import { Resource } from 'types/Resource';
import { Nullable } from 'types/utils';
import { CourseListItem as JoanieCourse } from 'types/Joanie';

export enum CourseOffer {
  PAID = 'paid',
  FREE = 'free',
  PARTIALLY_FREE = 'partially_free',
  SUBSCRIPTION = 'subscription',
}

export enum CourseCertificateOffer {
  PAID = 'paid',
  FREE = 'free',
  SUBSCRIPTION = 'subscription',
}

export interface Course extends Resource {
  absolute_url: string;
  categories: string[];
  code: Nullable<string>;
  cover_image: Nullable<{
    sizes: string;
    src: string;
    srcset: string;
  }>;
  duration: string;
  effort: string;
  icon: Nullable<{
    color: string;
    sizes: string;
    src: string;
    srcset: string;
    title: string;
  }>;
  organization_highlighted: string;
  organization_highlighted_cover_image: Nullable<{
    sizes: string;
    src: string;
    srcset: string;
  }>;
  organizations: string[];
  state: CourseState;
  certificate_offer: Nullable<CourseCertificateOffer>;
  offer: Nullable<CourseOffer>;
  certificate_price: Nullable<number>;
  price: Nullable<number>;
  price_currency: string;
}

export function isRichieCourse(course: Course | JoanieCourse): course is Course {
  return (course as Course).organization_highlighted !== undefined;
}
