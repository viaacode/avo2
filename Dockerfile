FROM node:12-alpine AS build

# set our node environment, defaults to production
ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

WORKDIR /app

COPY package.json package-lock.json .npmrc ./
RUN chown -R node:node /app

USER node
RUN npm ci --production=false 1&>/dev/null

COPY . .
RUN npm run build 1&>/dev/null
# set permissions for openshift
USER root
#RUN chmod -R g+rwx /app && chown 101:101 /app

FROM nginxinc/nginx-unprivileged AS run
USER root


COPY default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

WORKDIR /usr/share/nginx/html
COPY .env scripts/env.sh ./
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh && chown 101:101 /docker-entrypoint.sh
RUN chgrp -R 101 /usr/share/nginx/html && chmod -R g+rwx /usr/share/nginx/html

# Run script which initializes env vars to fs
RUN chmod +x env.sh
USER nginx
ENTRYPOINT ["/docker-entrypoint.sh"]
