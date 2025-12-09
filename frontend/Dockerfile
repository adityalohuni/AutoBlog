FROM debian:bookworm-slim as build

WORKDIR /app

RUN apt-get update && apt-get install -y curl unzip ca-certificates && \
    curl -fsSL https://bun.sh/install | bash

ENV BUN_INSTALL="/root/.bun"
ENV PATH="$BUN_INSTALL/bin:$PATH"

COPY package.json bun.lockb* ./
RUN bun install

COPY . .
RUN bun run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
