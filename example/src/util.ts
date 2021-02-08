
/**
 * Get string value from type "string[] | string"
 * @param arrayOrString
 */
export const getFirstValue = (arrayOrString: string[] | string) => {
  return Array.isArray(arrayOrString) ? arrayOrString[0] : arrayOrString
}
