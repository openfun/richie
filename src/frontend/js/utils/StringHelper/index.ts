import { Maybe, Nullable } from 'types/utils';
import { tokens } from 'utils/cunningham-tokens';

export class StringHelper {
  static isString(input: any): boolean {
    return typeof input === 'string' || input instanceof String;
  }

  static capitalizeFirst(str?: Nullable<string>): Maybe<Nullable<string>> {
    if (!str) {
      return str;
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  static abbreviate(str: string, maxLength?: number): string {
    return str
      .split(' ', maxLength)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }

  static toColor(
    string: string,
    saturation = tokens.themes.default.components.dashboardListAvatar.saturation,
    lightness = tokens.themes.default.components.dashboardListAvatar.lightness,
  ): string {
    let hash = 0;
    for (let i = 0; i < string.length; i++) {
      // eslint-disable-next-line no-bitwise
      hash = string.charCodeAt(i) + ((hash << 5) - hash);
      // eslint-disable-next-line no-bitwise
      hash &= hash;
    }

    const hue = hash % 360;

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }
}
