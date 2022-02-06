# MENU-GO

# Welcome to MENU-GO!

[🚜 Building .....]

# Table of Contents

- [Installation and Deployment](#installation-and-deployment)
  - [Development](#development)
  - [GitHub - Set-Up an OAuth Application](#github---set-up-an-oauth-application)
- [Talk with us or Report an Issue](#talk-with-us-or-report-an-issue)

# Installation and Documentation

## Development

1. Install the project with `npm install`
2. Initialize the `@prisma/client` with `npm prisma generate` or `npx prisma generate`
3. Set-up your environment variables following the `.env.example` file. NOTE: The environment file must be named like: `.env`
   - You can get the `GITHUB_ID` and `GITHUB_SECRET` following [GitHub - Set-Up an OAuth Application](#github-set-up-an-oauth-application)
   - You can set in `SECRET` whatever you want or a strong character string like a base64, sha1, etc...
   - You need to uncomment `NEXTAUTH_URL` to remove the warning alert in localhost.
4. Migrate the prisma generated database to the PostgreSQL on Railway with `npm run migrate:dev`
5. You can now start developing for vota.dev

## GitHub - Set-Up an OAuth Application

1. Login to [Login - GitHub](http://github.com/login)
2. Enter your applications in developer settings [Apps - GitHub](https://github.com/settings/apps)
3. Inside `OAuth Apps` click on `New OAuth App` and fill the fields.
   - You can set the 'Homepage URL' to `http://vota.dev` and the 'Callback URL' to `http://localhost:3000/api/auth/`
4. You can retrieve the Client ID and the Client Secret there

# Talk with us or Report an Issue
