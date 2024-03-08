/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CourseLight } from './CourseLight';
import type { LanguagesEnum } from './LanguagesEnum';

/**
 * Serialize all information about a course run
 */
export type CourseRun = {
  readonly course: CourseLight;
  readonly end: string | null;
  readonly enrollment_end: string | null;
  readonly enrollment_start: string | null;
  /**
   * primary key for the record as UUID
   */
  readonly id: string;
  /**
   * The list of languages in which the course content is available.
   *
   * * `af` - Afrikaans
   * * `ar` - Arabic
   * * `ar-dz` - Algerian Arabic
   * * `ast` - Asturian
   * * `az` - Azerbaijani
   * * `bg` - Bulgarian
   * * `be` - Belarusian
   * * `bn` - Bengali
   * * `br` - Breton
   * * `bs` - Bosnian
   * * `ca` - Catalan
   * * `ckb` - Central Kurdish (Sorani)
   * * `cs` - Czech
   * * `cy` - Welsh
   * * `da` - Danish
   * * `de` - German
   * * `dsb` - Lower Sorbian
   * * `el` - Greek
   * * `en` - English
   * * `en-au` - Australian English
   * * `en-gb` - British English
   * * `eo` - Esperanto
   * * `es` - Spanish
   * * `es-ar` - Argentinian Spanish
   * * `es-co` - Colombian Spanish
   * * `es-mx` - Mexican Spanish
   * * `es-ni` - Nicaraguan Spanish
   * * `es-ve` - Venezuelan Spanish
   * * `et` - Estonian
   * * `eu` - Basque
   * * `fa` - Persian
   * * `fi` - Finnish
   * * `fr` - French
   * * `fy` - Frisian
   * * `ga` - Irish
   * * `gd` - Scottish Gaelic
   * * `gl` - Galician
   * * `he` - Hebrew
   * * `hi` - Hindi
   * * `hr` - Croatian
   * * `hsb` - Upper Sorbian
   * * `hu` - Hungarian
   * * `hy` - Armenian
   * * `ia` - Interlingua
   * * `id` - Indonesian
   * * `ig` - Igbo
   * * `io` - Ido
   * * `is` - Icelandic
   * * `it` - Italian
   * * `ja` - Japanese
   * * `ka` - Georgian
   * * `kab` - Kabyle
   * * `kk` - Kazakh
   * * `km` - Khmer
   * * `kn` - Kannada
   * * `ko` - Korean
   * * `ky` - Kyrgyz
   * * `lb` - Luxembourgish
   * * `lt` - Lithuanian
   * * `lv` - Latvian
   * * `mk` - Macedonian
   * * `ml` - Malayalam
   * * `mn` - Mongolian
   * * `mr` - Marathi
   * * `ms` - Malay
   * * `my` - Burmese
   * * `nb` - Norwegian Bokmål
   * * `ne` - Nepali
   * * `nl` - Dutch
   * * `nn` - Norwegian Nynorsk
   * * `os` - Ossetic
   * * `pa` - Punjabi
   * * `pl` - Polish
   * * `pt` - Portuguese
   * * `pt-br` - Brazilian Portuguese
   * * `ro` - Romanian
   * * `ru` - Russian
   * * `sk` - Slovak
   * * `sl` - Slovenian
   * * `sq` - Albanian
   * * `sr` - Serbian
   * * `sr-latn` - Serbian Latin
   * * `sv` - Swedish
   * * `sw` - Swahili
   * * `ta` - Tamil
   * * `te` - Telugu
   * * `tg` - Tajik
   * * `th` - Thai
   * * `tk` - Turkmen
   * * `tr` - Turkish
   * * `tt` - Tatar
   * * `udm` - Udmurt
   * * `uk` - Ukrainian
   * * `ur` - Urdu
   * * `uz` - Uzbek
   * * `vi` - Vietnamese
   * * `zh-hans` - Simplified Chinese
   * * `zh-hant` - Traditional Chinese
   */
  readonly languages: LanguagesEnum;
  readonly resource_link: string;
  readonly start: string | null;
  readonly title: string;
  /**
   * Return the state of the course run at the current time.
   */
  readonly state: {
    priority: number;
    datetime: string | null;
    call_to_action: string | null;
    text: string;
  };
};

