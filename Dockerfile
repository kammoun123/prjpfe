FROM nginx:alpine
COPY dist/front /usr/share/nginx/html
EXPOSE 80
