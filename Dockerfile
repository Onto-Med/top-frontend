FROM node:alpine as develop-stage
WORKDIR /app
RUN yarn global add @quasar/cli
COPY . .

FROM develop-stage as build-stage
ARG NPM_AUTH_TOKEN
ARG AUTH_ENABLED
ENV NPM_AUTH_TOKEN=$NPM_AUTH_TOKEN
ENV AUTH_ENABLED=$AUTH_ENABLED
RUN yarn
RUN quasar build

FROM nginx:alpine as production-stage
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build-stage /app/dist/spa /opt/top-frontend
RUN echo "cp -r /opt/top-frontend/* /usr/share/nginx/html;" >> /docker-entrypoint.d/top-01-copy-files.sh && \
  echo "if [[ ! -z \"\${API_URL}\" ]]; then sed -i \"s|http\\://127.0.0.1\\:8080|\${API_URL}|g\" /usr/share/nginx/html/js/app.*.js; fi" >> /docker-entrypoint.d/top-02-set-api-url.sh && \
  echo "if [[ ! -z \"\${OAUTH2_URL}\" ]]; then sed -i \"s|http\\://127.0.0.1\\:8081|\${OAUTH2_URL}|g\" /usr/share/nginx/html/js/app.*.js; fi" >> /docker-entrypoint.d/top-03-set-oauth2-url.sh && \
  echo "if [[ ! -z \"\${OAUTH2_REALM}\" ]]; then sed -i \"s|top-realm|\${OAUTH2_REALM}|g\" /usr/share/nginx/html/js/app.*.js; fi" >> /docker-entrypoint.d/top-04-set-oauth2-realm.sh && \
  echo "if [[ ! -z \"\${OAUTH2_CLIENT_ID}\" ]]; then sed -i \"s|top-frontend|\${OAUTH2_CLIENT_ID}|g\" /usr/share/nginx/html/js/app.*.js; fi" >> /docker-entrypoint.d/top-05-set-oauth2-client-id.sh && \
  chmod u+x /docker-entrypoint.d/top-*.sh

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
