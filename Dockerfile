FROM node:lts-alpine3.20 AS build
WORKDIR /usr/local/app
COPY ./app /usr/local/app

RUN npm install

EXPOSE 8080
EXPOSE 3001

CMD ["npm", "run", "dev-all"]
