FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev

FROM node:20-alpine
RUN apk add --no-cache tini
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY src ./src
COPY package.json ./
RUN mkdir -p /data
EXPOSE 8090
USER node
ENTRYPOINT ["tini", "--"]
CMD ["node", "src/index.js"]
