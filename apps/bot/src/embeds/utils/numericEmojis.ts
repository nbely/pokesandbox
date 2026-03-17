const getNumericEmojisForIndex = (value: number): string => {
  const digitToEmojiMap = [
    '0️⃣',
    '1️⃣',
    '2️⃣',
    '3️⃣',
    '4️⃣',
    '5️⃣',
    '6️⃣',
    '7️⃣',
    '8️⃣',
    '9️⃣',
  ];

  if (value < 0) return '';

  const numAsString = value.toString();

  return Array.from(numAsString)
    .map((char) => digitToEmojiMap[parseInt(char, 10)] ?? '')
    .join('');
};

/**
 * Converts a numeric value to an emoji label with optional padding for alignment.
 * @param value - The 1-based numeric value to convert
 * @param shouldPadSingleEmojiLabels - Whether to add spacing for single-digit labels
 * @param shouldPadDoubleDigitEmojiLabels - Whether to add spacing for double-digit labels
 * @returns A string containing the numeric emoji and optional spacing
 */
export const getNumericEmojiLabel = (
  value: number,
  shouldPadSingleEmojiLabels = false,
  shouldPadDoubleDigitEmojiLabels = false
): string => {
  const emojiLabel = `${getNumericEmojisForIndex(value)}\u2009`;
  if (!emojiLabel) return '';

  if (shouldPadDoubleDigitEmojiLabels && value > 9 && value <= 99) {
    return `${emojiLabel}\u2007\u2007\u2006`;
  }

  if (!shouldPadSingleEmojiLabels || value > 9) {
    return emojiLabel;
  }

  // Single digit: two figure spaces plus one six-per-em space.
  return `${emojiLabel}\u2007\u2007\u2006`;
};

/**
 * Analyzes a column of indices to determine which digit ranges need padding for alignment.
 * @param column - Array of objects with numeric indices
 * @returns Object with padding requirements for single and double digit ranges
 */
export const getNumericEmojiPaddingRules = (
  column: { index: number }[]
): { padSingle: boolean; padDouble: boolean } => {
  const hasSingle = column.some(({ index }) => index <= 9);
  const hasDouble = column.some(({ index }) => index >= 10 && index <= 99);
  const hasTriple = column.some(({ index }) => index >= 100);

  return {
    padSingle: hasSingle && (hasDouble || hasTriple),
    padDouble: hasDouble && hasTriple,
  };
};
