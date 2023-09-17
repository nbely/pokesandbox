export const getLabelAcronym = (label: string): string => {
  const trimmedLabel = label.trim();
  const words = label.split(" ");
  let acronym = "";

  if (words.length > 1) {
    words.forEach((word) => {
      acronym += word[0].toLocaleUpperCase();
    });
  } else {
    let lastCharWasUpperCase = false;
    for (let i = 0; i < trimmedLabel.length; i++) {
      if (
        i === 0 ||
        (trimmedLabel[i] === trimmedLabel[i].toLocaleUpperCase() &&
          !lastCharWasUpperCase)
      ) {
        acronym += trimmedLabel[i].toLocaleUpperCase();
        lastCharWasUpperCase = true;
      } else {
        lastCharWasUpperCase = false;
      }
    }
  }
  return acronym;
};
