
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --production=false
COPY prisma ./prisma
RUN npx prisma generate
COPY src ./src
COPY uploads ./uploads
ENV NODE_ENV=production
EXPOSE 8080
CMD [ "sh", "-c", "npx prisma migrate deploy && node src/index.js" ]
