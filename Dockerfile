# Stage 1: Build the React Frontend
FROM node:18-alpine as builder
WORKDIR /app/frontend

# Copy package files and install dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy source code and build
COPY frontend/ .
RUN npm run build

# Stage 2: Setup Python Backend and Serve
FROM python:3.9-slim

WORKDIR /code

# Copy Backend Requirements and Install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Backend Code
COPY backend/ .

# Copy CSV Database
COPY Book1.csv .

# Copy Built Frontend from Stage 1 to /code/frontend_dist
COPY --from=builder /app/frontend/dist ./frontend_dist

# Expose port (Render sets $PORT env var, user needs to bind to it)
# We will use a script or direct command. Uvicorn needs to know the port.
CMD sh -c "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"
