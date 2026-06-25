FROM python:3.12-slim
WORKDIR /app
COPY . .
RUN pwd; echo "---LS-APP---"; ls -la /app; echo "---FIND-REQ---"; find / -name "requirements.txt" 2>/dev/null; true
CMD sleep 3600
