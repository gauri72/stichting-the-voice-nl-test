const MIN_LENGTH = 10;
const MIN_CHARACTER_CLASSES = 3;

/**
 * Throws a 400 error if the password doesn't meet the minimum bar: length
 * plus at least 3 of {lowercase, uppercase, digit, symbol}.
 */
export function assertPasswordPolicy(password) {
  const value = String(password || "");

  if (value.length < MIN_LENGTH) {
    const err = new Error(`Password must be at least ${MIN_LENGTH} characters long.`);
    err.status = 400;
    throw err;
  }

  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((re) => re.test(value)).length;
  if (classes < MIN_CHARACTER_CLASSES) {
    const err = new Error(
      "Password must include at least 3 of: lowercase letters, uppercase letters, numbers, symbols."
    );
    err.status = 400;
    throw err;
  }
}
