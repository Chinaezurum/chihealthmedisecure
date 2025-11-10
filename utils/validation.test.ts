import { describe, it, expect } from 'vitest';
import { checkPasswordStrength } from './validation.ts';

describe('checkPasswordStrength', () => {
  it('should return score -1 for empty password', () => {
    const result = checkPasswordStrength('');
    expect(result.score).toBe(-1);
  });

  it('should return score 0 for a very weak password that is too short', () => {
    const result = checkPasswordStrength('abc');
    expect(result.score).toBe(0); // Only lowercase, not long enough
    expect(result.isLongEnough).toBe(false);
  });
  
  it('should return score 1 for a weak password with only one character type but correct length', () => {
    const result = checkPasswordStrength('abcdefgh');
    expect(result.score).toBe(1); // lowercase and long enough
    expect(result.isLongEnough).toBe(true);
    expect(result.hasLowerCase).toBe(true);
  });

  it('should return score 2 for a medium password with two character types and correct length', () => {
    const result = checkPasswordStrength('Abcdefgh');
    expect(result.score).toBe(2); // lowercase, uppercase, long enough
  });
  
  it('should still return score 2 if it has three types but is too short', () => {
    const result = checkPasswordStrength('Abc1');
    expect(result.score).toBe(2);
  });
  
  it('should return score 3 for a strong password with three character types', () => {
    const result = checkPasswordStrength('Abcdefgh1');
    expect(result.score).toBe(3); // + number
  });

  it('should return score 4 for a very strong password with all character types', () => {
    const result = checkPasswordStrength('Abcdefgh1!');
    expect(result.score).toBe(4); // + symbol
    expect(result.hasLowerCase).toBe(true);
    expect(result.hasUpperCase).toBe(true);
    expect(result.hasNumber).toBe(true);
    expect(result.hasSymbol).toBe(true);
    expect(result.isLongEnough).toBe(true);
  });
});
