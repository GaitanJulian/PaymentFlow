FROM python:3.12-slim

WORKDIR /app

# Evitar buffer en logs
ENV PYTHONUNBUFFERED=1

# Instalar dependencias del sistema si SQLModel/psycopg2 lo necesita
RUN apt-get update && apt-get install -y build-essential libpq-dev && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
