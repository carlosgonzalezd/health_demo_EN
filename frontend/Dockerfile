# Build Stage
FROM node:18-alpine as build
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
# Remove any broken symlink and replace with empty placeholder (synced at runtime)
RUN if [ -L public/saved_tokens.md ]; then rm public/saved_tokens.md && echo '# Token Savings Report\n(Loading...)' > public/saved_tokens.md; fi
RUN npm run build

# Serve Stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
