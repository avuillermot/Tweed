FROM node:latest
RUN mkdir -p /usr/nodeapp
COPY . /usr/nodeapp
WORKDIR /usr/nodeapp
RUN ls
RUN npm install --verbose
CMD ["node","src/index.ts"]
