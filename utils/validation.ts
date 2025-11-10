export interface PasswordStrengthResult {
  score: -1 | 0 | 1 | 2 | 3 | 4; // -1 for no input, 0-4 for strength
  hasLowerCase: boolean;
  hasUpperCase: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
  isLongEnough: boolean;
}

export const checkPasswordStrength = (password: string): PasswordStrengthResult => {
  if (!password) {
    return { score: -1, hasLowerCase: false, hasUpperCase: false, hasNumber: false, hasSymbol: false, isLongEnough: false };
  }

  const hasLowerCase = /[a-z]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isLongEnough = password.length >= 8;

  let score = 0;
  if (hasLowerCase) score++;
  if (hasUpperCase) score++;
  if (hasNumber) score++;
  if (hasSymbol) score++;

  if (!isLongEnough && score > 0) {
    score = Math.max(score - 1, 0);
  }

  return {
    score: score as PasswordStrengthResult['score'],
    hasLowerCase,
    hasUpperCase,
    hasNumber,
    hasSymbol,
    isLongEnough,
  };
};