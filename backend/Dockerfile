FROM debian:bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y curl unzip ca-certificates && \
    curl -fsSL https://bun.sh/install | bash

ENV BUN_INSTALL="/root/.bun"
ENV PATH="$BUN_INSTALL/bin:$PATH"

COPY package.json bun.lockb* ./

RUN bun install

COPY . .

EXPOSE 3000

CMD ["bun", "src/index.ts"]
