FROM node:alpine AS build-stage
WORKDIR /app
RUN npm i -g @quasar/cli
ARG NPM_AUTH_TOKEN
ENV NPM_AUTH_TOKEN=$NPM_AUTH_TOKEN
COPY . .
RUN npm install
RUN quasar build

FROM nginx:alpine AS production-stage
COPY --from=build-stage /app/dist/spa /opt/top-frontend
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker-entrypoint.d/* /docker-entrypoint.d/
RUN chmod u+x /docker-entrypoint.d/*.sh
RUN sed -i "s|notice|error|" /etc/nginx/nginx.conf

EXPOSE 80

ENV NGINX_ENTRYPOINT_QUIET_LOGS=1
ENV NGINX_ACCESS_LOG=false
ENV NGINX_ERROR_LOG_LEVEL=warn

CMD ["nginx", "-g", "daemon off;"]
