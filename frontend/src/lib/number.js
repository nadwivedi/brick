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
