import { CourseRun } from 'types';
import { EnrollmentAwarenessMessageVariant, EnrollmentAwarenessRule } from 'types/commonDataProps';

export interface EnrollmentAwarenessMessage {
  id: string;
  variant: EnrollmentAwarenessMessageVariant;
  text: string;
}

export interface EnrollmentAwareness {
  /** Label replacing the default "Enroll now" CTA, if a rule defines one. */
  enrollLabel?: string;
  /** Label replacing the default "Log in to enroll" CTA, if a rule defines one. */
  loginLabel?: string;
  /** Messages to display next to the CTA, in the order of the matching rules. */
  messages: EnrollmentAwarenessMessage[];
}

export interface EnrollmentAwarenessContext {
  /** Whether the course run is hosted outside of the configured LMS backends. */
  isExternal: boolean;
}

const EMPTY_AWARENESS: EnrollmentAwareness = { messages: [] };

/**
 * Check whether a course run matches all the conditions of a rule.
 */
export const matchesEnrollmentAwarenessRule = (
  rule: EnrollmentAwarenessRule,
  courseRun: CourseRun,
  { isExternal }: EnrollmentAwarenessContext,
): boolean => {
  const { when } = rule;

  if (when.offer !== undefined && !when.offer.includes(courseRun.offer ?? '')) {
    return false;
  }

  if (
    when.certificate_offer !== undefined &&
    !when.certificate_offer.includes(courseRun.certificate_offer ?? '')
  ) {
    return false;
  }

  if (
    when.languages !== undefined &&
    !when.languages.some((language) => (courseRun.languages ?? []).includes(language))
  ) {
    return false;
  }

  if (when.is_external !== undefined && when.is_external !== isExternal) {
    return false;
  }

  return true;
};

/**
 * Evaluate the enrollment awareness rules against a course run.
 *
 * Rules are evaluated in order. All the messages of the matching rules are collected, and the
 * first matching rule defining a given CTA label wins for that label.
 */
export const getEnrollmentAwareness = (
  rules: EnrollmentAwarenessRule[] | undefined,
  courseRun: CourseRun,
  context: EnrollmentAwarenessContext,
): EnrollmentAwareness => {
  if (!rules || rules.length === 0) {
    return EMPTY_AWARENESS;
  }

  return rules.reduce<EnrollmentAwareness>(
    (awareness, rule) => {
      if (!matchesEnrollmentAwarenessRule(rule, courseRun, context)) {
        return awareness;
      }
      return {
        enrollLabel: awareness.enrollLabel ?? rule.cta?.enroll,
        loginLabel: awareness.loginLabel ?? rule.cta?.login,
        messages: rule.message
          ? [...awareness.messages, { id: rule.id, ...rule.message }]
          : awareness.messages,
      };
    },
    { messages: [] },
  );
};
