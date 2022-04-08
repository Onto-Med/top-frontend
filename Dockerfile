FROM node:alpine as develop-stage
WORKDIR /app
RUN yarn add -q @quasar/cli
COPY . .

FROM develop-stage as build-stage
RUN yarn
RUN quasar build

FROM nginx:alpine as production-stage
COPY --from=build-stage /app/dist/* /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
