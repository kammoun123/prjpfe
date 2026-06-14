# ---- STAGE BUILD ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build --configuration=production

# ---- STAGE RUN ----
FROM nginx:alpine
COPY --from=build /app/dist/pfe/browser /usr/share/nginx/html
# استخدام index.csr.html كـ index.html الرئيسي
RUN cp /usr/share/nginx/html/index.csr.html /usr/share/nginx/html/index.html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

