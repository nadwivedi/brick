// Spread onto <input type="number"> for quantities, rates and amounts that can never be
// below zero: the arrows and mouse wheel stop at 0, a minus sign cannot be typed, and a
// pasted negative value is turned into 0.
export const NON_NEGATIVE = {
  min: 0,
  onKeyDown: (e) => {
    if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault();
  },
  onPaste: (e) => {
    if (Number(e.clipboardData.getData('text')) < 0) e.preventDefault();
  },
};

// For the value of a number box: a stored 0 shows as an empty box (the placeholder), so typing
// does not end up after it as "022"
export const blankZero = (v) => (v === 0 ? '' : v);
// For a typed number: "022" becomes "22" (a lone "0" and "0.5" stay as typed)
export const noLeadingZeros = (v) => String(v).replace(/^0+(?=\d)/, '');
