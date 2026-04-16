FROM node:20-alpine

WORKDIR /srv

COPY backend/package*.json ./
RUN npm ci

COPY backend ./

EXPOSE 4000

CMD ["npm", "run", "start"]
