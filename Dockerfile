FROM node:latest
ENV PORT=8081 MONGOHOST=mongodb://localhost:27017/tweed
RUN mkdir -p /usr/nodeapp
COPY . /usr/nodeapp
WORKDIR /usr/nodeapp
RUN ls
RUN npm install --verbose
CMD ["npx","ts-node","src/index.ts"]
RUN ls src
