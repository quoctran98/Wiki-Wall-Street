FROM python:3.11-slim

WORKDIR /server

COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["gunicorn", "-b", "0.0.0.0:8000", "--workers", "8", "--threads", "12", "--preload", "--worker-tmp-dir", "/dev/shm", "appserver:gunicorn_app"]