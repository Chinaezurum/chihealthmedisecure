import bcrypt from 'bcryptjs';
const SALT_ROUNDS = 10;
/**
 * Hashes a plaintext password using bcrypt.
 * @param password - The plaintext password to hash.
 * @returns A promise that resolves to the hashed password.
 */
export const hashPassword = (password) => {
    return bcrypt.hash(password, SALT_ROUNDS);
};
/**
 * A synchronous version of hashPassword, useful for seeding.
 */
export const hashPasswordSync = (password) => {
    return bcrypt.hashSync(password, SALT_ROUNDS);
};
/**
 * Compares a plaintext password with a hashed password.
 * @param password - The plaintext password.
 * @param hash - The hashed password to compare against.
 * @returns A promise that resolves to true if the passwords match, false otherwise.
 */
export const comparePassword = (password, hash) => {
    return bcrypt.compare(password, hash);
};
//# sourceMappingURL=password.js.map