FROM node:22-alpine AS build
WORKDIR /app
COPY medwork-frontend/package*.json ./
RUN npm ci
COPY medwork-frontend/ .
ENV VITE_API_BASE_URL=http://localhost:5279
RUN npm run build

FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/node_modules ./node_modules
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]