###################
# BUILD FOR LOCAL DEVELOPMENT
###################

FROM node:22-alpine As development

ENV HOST 0.0.0.0
WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./
COPY --chown=node:node prisma ./prisma/

RUN npm ci
RUN npx prisma generate

COPY --chown=node:node . .

USER node

###################
# BUILD FOR PRODUCTION
###################

FROM node:22-alpine As build

ENV HOST 0.0.0.0
WORKDIR /usr/src/app

ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

COPY --chown=node:node package*.json ./
COPY --chown=node:node prisma ./prisma/

COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules

COPY --chown=node:node . .

RUN npx prisma generate

RUN npm run build
RUN npm ci --only=production && npm cache clean --force

USER node

###################
# PRODUCTION
###################

FROM node:22-alpine As production

ENV NODE_ENV=production
WORKDIR /usr/src/app

COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist
COPY --chown=node:node --from=build /usr/src/app/prisma ./prisma

RUN npm i -g prisma

EXPOSE 8000

CMD ["sh", "-c", "prisma migrate deploy && node dist/app.js"]