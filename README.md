# Setup

1. git clone `https://github.com/kiranapro/node-backend.git`.
2. Change directory and run a `npm install`.
3. Populate `.env` file after copy pasting `.env.example`.
4. Do a migration for prisma if you're using new prisma pg database `npx prisma migrate dev --name init` for a developmental database and if for production, use `npx prisma generate --no-engine`.
5. Run the app through `npm run dev` for development or `npm run develop` for developing tsc build.

# Deployment

For deployment, use `/dist` folder

# Versions

Latest version: `1.4.0`
Current Stable Version: `1.2.8`