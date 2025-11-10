# Security Policy for ChiHealth MediSecure

This document outlines the security measures and policies implemented within the ChiHealth MediSecure platform to ensure data integrity, confidentiality, and availability. This serves as the final documentation of the platform's security architecture as of the completion of the initial project roadmap.

## Implemented Security Measures

Our platform is built with a security-first mindset. The following measures are currently in place:

### 1. Authentication and Authorization

-   **Secure Authentication:** User authentication is handled via a robust, token-based system using **JSON Web Tokens (JWTs)**. Passwords are never stored in plaintext; they are securely hashed using the industry-standard **bcrypt** algorithm.
-   **Role-Based Access Control (RBAC):** The backend implements strict RBAC on all API endpoints. An authentication middleware verifies the user's JWT on every request and ensures they have the correct role (e.g., `hcw`, `pharmacist`, `admin`) to access a given resource or perform an action. This prevents unauthorized data access between different user types.
-   **Session Management:** User sessions have a defined expiration time. The frontend includes a session timeout feature that warns users of inactivity and automatically logs them out to prevent unauthorized access to unattended terminals.

### 2. Data and Network Security

-   **Server-Side Input Validation:** All data submitted to the API is rigorously validated on the server-side using `express-validator` schemas. This is a critical defense against common injection attacks (e.g., SQL injection, XSS) and prevents corrupted data from entering the database.
-   **API Protection:** The API is protected against brute-force attacks and denial-of-service attempts using **rate limiting**.
-   **Security Headers:** The application uses the `helmet` library to automatically apply crucial HTTP security headers (e.g., `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`). This helps mitigate a wide range of common web vulnerabilities.
-   **Encrypted Transport:** In a production deployment (e.g., on GCP Cloud Run), all traffic between the client and the server is encrypted using TLS/SSL (HTTPS).

### 3. Infrastructure and Development

-   **Containerization:** The entire application is containerized using Docker, ensuring a consistent and isolated environment that reduces the risk of "it works on my machine" issues and configuration drift.
-   **Secrets Management:** The CI/CD pipeline is designed to use secure secrets management (e.g., GitHub Secrets) for all sensitive credentials like database URLs, API keys, and service account information. These are never hardcoded in the source code.
-   **Dependency Scanning:** (Assumed for production) Regular dependency scanning would be implemented in the CI/CD pipeline to check for known vulnerabilities in third-party libraries.

## Path to HIPAA Compliance

While the platform is designed with security best practices that align with HIPAA principles, achieving formal compliance is a rigorous process that goes beyond code implementation.

**Current State:** The foundational technical safeguards required by HIPAA are in place (access control, data integrity, etc.).

**Next Steps (Post-Development):**

1.  **Formal Third-Party Audit:** To be considered HIPAA compliant and legally handle Protected Health Information (PHI) in the United States, the platform must undergo a formal audit by a certified third-party organization.
2.  **Business Associate Agreements (BAAs):** We would need to sign BAAs with all third-party services that may come into contact with PHI, including our cloud provider (Google Cloud Platform).
3.  **Comprehensive Audit Logging:** While basic logging is in place, a compliance audit would verify that we are logging all events involving access to or modification of PHI, and that these logs are stored securely and are tamper-proof.
4.  **Data Encryption at Rest:** The production database (e.g., GCP Cloud SQL) must be configured to encrypt all data at rest.

**Disclaimer:** ChiHealth MediSecure, in its current state, should not be used with real Protected Health Information (PHI) until it has successfully completed a formal HIPAA compliance audit.