const getNumericEmojisForIndex = (index: number): string => {
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

  if (index < 0) return '';

  const numAsString = (index + 1).toString();

  return Array.from(numAsString)
    .map((char) => digitToEmojiMap[parseInt(char, 10)] ?? '')
    .join('');
};

/**
 * Converts a numeric index to an emoji label with optional padding for alignment.
 * @param index - The zero-based index to convert
 * @param shouldPadSingleEmojiLabels - Whether to add spacing for single-digit labels
 * @param shouldPadDoubleDigitEmojiLabels - Whether to add spacing for double-digit labels
 * @returns A string containing the numeric emoji and optional spacing
 */
export const getNumericEmojiLabel = (
  index: number,
  shouldPadSingleEmojiLabels = false,
  shouldPadDoubleDigitEmojiLabels = false
): string => {
  const emojiLabel = `${getNumericEmojisForIndex(index)}\u2009`;
  if (!emojiLabel) return '';

  if (shouldPadDoubleDigitEmojiLabels && index >= 9 && index < 99) {
    return `${emojiLabel}\u2007\u2007\u2006`;
  }

  if (!shouldPadSingleEmojiLabels || index >= 9) {
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
  const hasSingle = column.some(({ index }) => index + 1 <= 9);
  const hasDouble = column.some(
    ({ index }) => index + 1 >= 10 && index + 1 <= 99
  );
  const hasTriple = column.some(({ index }) => index + 1 >= 100);

  return {
    padSingle: hasSingle && (hasDouble || hasTriple),
    padDouble: hasDouble && hasTriple,
  };
};
