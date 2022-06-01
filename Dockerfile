FROM node:alpine as develop-stage
WORKDIR /app
RUN yarn global add @quasar/cli
COPY . .

ARG NPM_AUTH_TOKEN
ARG AUTH_ENABLED
FROM develop-stage as build-stage
ENV NPM_AUTH_TOKEN=$NPM_AUTH_TOKEN
ENV AUTH_ENABLED=$AUTH_ENABLED
RUN yarn
RUN quasar build

FROM nginx:alpine as production-stage
COPY --from=build-stage /app/dist/spa /opt/top-frontend
RUN echo "cp -r /opt/top-frontend/* /usr/share/nginx/html; if [[ ! -z \"\${API_URL}\" ]]; then sed -i \"s|http\\://localhost\\:8080|\${API_URL}|g\" /usr/share/nginx/html/js/app.*.js; fi" \
  >> /docker-entrypoint.d/set_api_url.sh && \
  chmod u+x /docker-entrypoint.d/set_api_url.sh

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
