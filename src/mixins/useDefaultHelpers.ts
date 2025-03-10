export default function (this: void) {
  return {
    /**
     * Creates a naive deep copy of the provided object.
     * Be careful when using this method, as some complex nested objects may lose information or break.
     * @param obj The object to create a copy for.
     * @returns The resulting copy.
     */
    copy: <T>(obj: T): T => {
      return JSON.parse(JSON.stringify(obj)) as T
    },

    /**
     * Converts a string or number to a valid string representation of a TOP entity ID.
     * @param input The string or number.
     * @returns The resulting TOP entity ID.
     */
    toValidId: (input: string | number | null): string => {
      return input ? (input as string).replace(/[^\w\d-]/gi, '_').toLowerCase() : ''
    },
  }
}
