# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /usr/src/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend
FROM node:18-alpine
WORKDIR /usr/src/app
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
RUN npm run build

# Copy frontend build to backend public folder
COPY --from=frontend-builder /usr/src/frontend/dist /usr/src/app/public

EXPOSE 5000
ENV PORT=5000
ENV NODE_ENV=production

CMD ["npm", "start"]
