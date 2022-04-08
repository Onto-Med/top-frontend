FROM node:alpine as develop-stage
WORKDIR /app
RUN yarn global add @quasar/cli
COPY . .

ARG NPM_AUTH_TOKEN
FROM develop-stage as build-stage
ENV NPM_AUTH_TOKEN=$NPM_AUTH_TOKEN
RUN yarn
RUN quasar build

FROM nginx:alpine as production-stage
COPY --from=build-stage /app/dist/spa /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
