export const assertNumericInput = (
  value?: string | number,
  inputName?: string
): number | undefined => {
  if (!value && value !== 0) {
    return undefined;
  } else if (typeof value === 'number') {
    return value;
  } else if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      throw new Error(
        `Entered value ${
          inputName ? `for '${inputName}' ` : ''
        }must be a valid integer.`
      );
    }
    return parsed;
  }
};
