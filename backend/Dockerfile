FROM python:3.12-slim
WORKDIR /app
COPY . .
RUN pip install --no-cache-dir -r requirements.txt || pip install --no-cache-dir -r backend/requirements.txt
CMD cd /app/backend 2>/dev/null; python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
