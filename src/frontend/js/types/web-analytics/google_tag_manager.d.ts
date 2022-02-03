/**
 * Declare the Google Tag Manager `window.dataLayer` array.
 * Used when the web analytics is configured with `google_tag_manager`.
 *
 * So we can use `window.dataLayer` has normal JS code.
 *
 * window.dataLayer.push({
 *     event: 'event',
 *     eventProps: {
 *         category: category,
 *         action: action,
 *         label: label,
 *         value: value
 *     }
 * });
 */
interface Window {
  dataLayer?: Record<string, any>[];
}
