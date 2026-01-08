# Stage 1: Build the React Frontend
# Assumes 'frontend' folder exists. If you flattened that too, look for package.json in root.
FROM node:18-alpine as builder
WORKDIR /app/frontend

# Try to copy from frontend folder. 
COPY frontend/package*.json ./
RUN npm install

COPY frontend/ .
RUN npm run build

# Stage 2: Setup Python Backend
FROM python:3.9-slim

WORKDIR /code

# Copy dependencies directly from ROOT (since you uploaded them loose)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend files from ROOT
COPY main.py data_processing.py Book1.csv ./

# Copy the built frontend from Stage 1
COPY --from=builder /app/frontend/dist ./frontend_dist

# Run
CMD sh -c "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"
