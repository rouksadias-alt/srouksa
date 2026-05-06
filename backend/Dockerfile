FROM python:3.12-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates tar \
    && rm -rf /var/lib/apt/lists/*

ARG GEOIPUPDATE_VERSION=7.0.1
RUN curl -fsSL "https://github.com/maxmind/geoipupdate/releases/download/v${GEOIPUPDATE_VERSION}/geoipupdate_${GEOIPUPDATE_VERSION}_linux_amd64.tar.gz" \
        | tar -xz -C /tmp \
    && mv "/tmp/geoipupdate_${GEOIPUPDATE_VERSION}_linux_amd64/geoipupdate" /usr/local/bin/geoipupdate \
    && rm -rf "/tmp/geoipupdate_${GEOIPUPDATE_VERSION}_linux_amd64"

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

RUN mkdir -p /data/geoip

COPY app ./app
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["fastapi", "run", "app/main.py", "--host", "0.0.0.0", "--port", "8000"]
