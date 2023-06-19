FROM node:alpine as develop-stage
WORKDIR /app
RUN yarn global add @quasar/cli
COPY . .

FROM develop-stage as build-stage
ARG NPM_AUTH_TOKEN
ENV NPM_AUTH_TOKEN=$NPM_AUTH_TOKEN
RUN yarn
RUN quasar build

FROM nginx:alpine as production-stage
COPY --from=build-stage /app/dist/spa /opt/top-frontend
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.d/* /docker-entrypoint.d/
RUN chmod u+x /docker-entrypoint.d/*.sh

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
