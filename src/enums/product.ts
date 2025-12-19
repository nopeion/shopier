/**
 * Product types supported by Shopier
 * @enum {number}
 */
export enum ProductType {
  /** Physical product that requires shipping */
  REAL_OBJECT = 0,
  /** Digital/downloadable product */
  DOWNLOADABLE_VIRTUAL = 1,
  /** Default product type */
  DEFAULT = 2
}
