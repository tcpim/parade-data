# parade-data

## Start local cloud auth proxy
```
./cloud-sql-proxy \
--credentials-file /Users/timwang/src/parade/cloud-sql-test-377705-b4c77cde2242.json cloud-sql-test-377705:us-central1:quickstart-instance & 
```

### Send request locally
```
npm start
curl -X POST localhost:8081/insert

curl -X POST https://parade-data-lbbl5ziblq-wl.a.run.app/insert
```