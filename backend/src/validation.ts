// This file can be used to define validation schemas for API requests
// using a library like Joi or Zod.

// Example using a placeholder function. In a real app, you'd use a library.

export const validateLogin = (data: any) => {
    if (!data.email || !data.password) {
        throw new Error("Email and password are required.");
    }
    return true;
};

export const validateRegistration = (data: any) => {
    if (!data.fullName || !data.email || !data.password) {
        throw new Error("Full name, email, and password are required.");
    }
     if (data.password.length < 8) {
        throw new Error("Password must be at least 8 characters long.");
    }
    return true;
}
