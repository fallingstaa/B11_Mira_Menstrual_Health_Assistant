import 'i18next';

import type { en } from './locales/en';

// Makes t('some.key') type-checked against en.ts, so a typo'd key fails tsc.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: typeof en };
  }
}
