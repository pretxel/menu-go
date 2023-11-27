FROM node:20-buster-slim

ENV NODE_ENV development

#add turborepo
RUN npm -g install npm
RUN npm -g install dotenv-cli
RUN apt-get update -y && apt-get install -y openssl xdg-utils
# RUN yarn global add turbo

#add strapi
#RUN yarn global add @strapi/strapi@${STRAPI_VERSION}

# Set working directory
WORKDIR /app

# Install app dependencies
COPY  ["package-lock.json", "package.json", "./"]

# Copy source files
COPY . .

# Install app dependencies
RUN npm install
# Install app dependencies
# RUN yarn install


EXPOSE 3000

CMD ["npm", "run", "dev"]
