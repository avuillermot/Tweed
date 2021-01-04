FROM node:latest
ENV PORT=8081 MONGOHOST=mongodb://pc-246.home:27017/tweed
RUN mkdir -p /usr/nodeapp
COPY . /usr/nodeapp
WORKDIR /usr/nodeapp
RUN ls
RUN npm install --verbose
CMD ["npx","ts-node","src/index.ts"]
RUN ls src
