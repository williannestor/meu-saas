FROM node:22-alpine

WORKDIR /app
COPY package.json ./
COPY server.js index.html app.js styles.css README.md ./
COPY data ./data
COPY workflows ./workflows
COPY supabase ./supabase

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "server.js"]
