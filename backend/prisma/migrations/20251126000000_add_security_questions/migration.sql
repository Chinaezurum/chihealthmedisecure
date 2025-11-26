-- AddSecurityQuestions
-- Add securityQuestions field to User model for security questions MFA

ALTER TABLE "User" ADD COLUMN "securityQuestions" JSONB;
