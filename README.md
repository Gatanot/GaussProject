```bash
docker pull opengauss/opengauss:latest
docker run --name opengauss --privileged=true -d -p 5432:5432 --shm-size=4g -e GS_PASSWORD='0316Pro?' opengauss/opengauss:latest
```
```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=gaussdb
DB_PASSWORD=0316Pro?
DB_DATABASE=opengauss
DB_MAX_CLIENTS=20
DB_IDLE_TIMEOUT_MS=30000
DB_CONNECTION_TIMEOUT_MS=2000
```