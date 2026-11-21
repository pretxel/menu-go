# Spec Delta: password-auth

## Purpose

Lets restaurant owners create an account and sign in with an email and password, as an alternative to Google or Facebook, without weakening account security.

## ADDED Requirements

### Requirement: Sign-up with email and password
A visitor SHALL be able to create an account with a valid email, a password of 8 to 128 characters, and an optional name. Emails are compared case-insensitively and stored lowercased. On success the visitor is signed in and sent to the requested callback (default `/panel`).

#### Scenario: Successful sign-up
- **WHEN** a visitor signs up with `Owner@Example.com` and password `correct-horse-1`
- **THEN** an account for `owner@example.com` exists, the visitor is signed in, and lands on the callback URL

#### Scenario: Weak or invalid input is refused
- **WHEN** a visitor signs up with an invalid email or a password shorter than 8 characters
- **THEN** no account is created and the form shows which field is wrong

#### Scenario: Email already has an account
- **WHEN** a visitor signs up with an email that already belongs to an account (password or OAuth)
- **THEN** no account is created or changed, and the visitor is told to sign in instead

### Requirement: Passwords are never stored in plain text
The system SHALL store only a salted, deliberately slow hash of each password, with a unique random salt per account. Plain passwords MUST NOT be persisted or logged.

#### Scenario: Stored value is a hash
- **WHEN** an account is created with a password
- **THEN** the stored value differs from the password, and two accounts with the same password have different stored values

### Requirement: Sign-in with email and password
A user SHALL be able to sign in with their email (any letter case) and correct password. A wrong password, an unknown email, or an account without a password MUST all get the same generic error and no session.

#### Scenario: Correct credentials
- **WHEN** a user signs in with their email and correct password
- **THEN** they get a session and land on the callback URL

#### Scenario: Wrong password
- **WHEN** a user signs in with a wrong password
- **THEN** no session is issued and the page shows "Invalid email or password."

#### Scenario: Unknown email
- **WHEN** someone signs in with an email that has no account
- **THEN** no session is issued and the page shows the same "Invalid email or password." message

#### Scenario: OAuth-only account
- **WHEN** someone signs in with a password for an account created through Google or Facebook
- **THEN** no session is issued and the page shows the same generic message

#### Scenario: Former stub credentials no longer work
- **WHEN** someone posts arbitrary credentials such as `jsmith` / any password to the credentials sign-in endpoint
- **THEN** no session is issued

### Requirement: Lockout after repeated failures
After 5 consecutive failed password attempts on an account, password sign-in for that account SHALL be refused for 15 minutes, even with the correct password. A successful sign-in resets the counter.

#### Scenario: Account locks after 5 failures
- **WHEN** 5 wrong passwords are submitted for one account and then the correct password is submitted within 15 minutes
- **THEN** the correct attempt gets no session and the generic error

#### Scenario: Lock expires
- **WHEN** the correct password is submitted after the 15-minute lock has passed
- **THEN** the user is signed in and the failure counter is reset

### Requirement: OAuth sign-in reclaims unverified password accounts
Because sign-up does not verify email ownership, when someone signs in with Google or Facebook using an email that belongs to a password account whose email is not verified, the system SHALL keep the account and its restaurant, mark the email verified, and invalidate the stored password.

#### Scenario: Real owner signs in with Google
- **WHEN** a password account exists for `owner@example.com` with an unverified email, and the owner signs in with Google as `owner@example.com`
- **THEN** the owner is signed into that same account, and the previous password no longer signs anyone in

#### Scenario: Verified account keeps its password
- **WHEN** an account whose email is already verified signs in with Google
- **THEN** its password (if any) keeps working

### Requirement: Login page offers email and password
The `/login` page SHALL show an email and password form alongside the Google and Facebook buttons, with a way to switch between signing in and creating an account. Both modes honor the same relative `callbackUrl` as the OAuth buttons.

#### Scenario: Funnel callback is kept
- **WHEN** a visitor arrives at `/login?callbackUrl=/d/publish` and creates an account
- **THEN** after sign-up they land on `/d/publish`
