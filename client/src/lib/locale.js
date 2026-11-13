import russian from '../data/ru.js';

export function translate(language, message, ...values) {
  const text = language === 'ru' && Object.hasOwn(russian, message) ? russian[message] : message;
  return typeof text === 'string'
    ? text.replace(/\{(\d+)\}/g, (placeholder, index) => values[index] ?? placeholder)
    : text;
}
