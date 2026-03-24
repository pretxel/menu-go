FROM node:22-bookworm-slim

ENV NODE_ENV development

#add turborepo
RUN npm -g install pnpm
RUN npm -g install dotenv-cli
RUN apt-get update -y && apt-get install -y openssl xdg-utils
# RUN yarn global add turbo

#add strapi
#RUN yarn global add @strapi/strapi@${STRAPI_VERSION}

# Set working directory
WORKDIR /app

# Install app dependencies
COPY  ["pnpm-lock.yaml", "pnpm-workspace.yaml", "package.json", "./"]

# Copy source files
COPY . .

# Install app dependencies
RUN pnpm install
# Install app dependencies
# RUN yarn install


EXPOSE 3000

CMD ["pnpm", "run", "dev"]
