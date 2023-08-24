import { IntlShape, MessageDescriptor, MessageFormatElement } from 'react-intl';
import { Maybe } from 'types/utils';
import { joinAnd } from 'utils/JoinAnd';

export class IntlHelper {
  /**
   * Tells if `values` contains all required values for `descriptor`.
   *
   * For example:
   *
   * #1
   * values = {}
   * descriptor represent "Hello {name}"
   * Returns false.
   *
   * #1
   * values = {name: "Bob"}
   * descriptor represent "Hello {name}"
   * Returns true.
   *
   * @param descriptor
   * @param values
   */
  static doValuesExist(descriptor: MessageDescriptor, values: Record<string, string>): boolean {
    const extractedValues = IntlHelper.extractValueNamesFromDescriptor(descriptor);
    return extractedValues.reduce((previous, value) => {
      return previous && !!values[value];
    }, true);
  }

  static extractValueNamesFromDescriptor(descriptor: MessageDescriptor): string[] {
    return (descriptor.defaultMessage as MessageFormatElement[])
      .filter((part) => part.type === 1)
      .map((part) => (part as any).value);
  }

  static extractValueNames(str: Maybe<string>): string[] {
    if (!str) {
      return [];
    }
    const matches = Array.from(str.matchAll(/{(\w+)}/g), (m) => m[1]);
    return matches;
  }

  static getLocalizedLanguages(languages: string[], intl: IntlShape) {
    return joinAnd(
      languages
        .map((language) => intl.formatDisplayName(language, { type: 'language' })!)
        .sort((a, b) => a.localeCompare(b, [intl.locale, intl.defaultLocale])),
      intl,
    );
  }
}
