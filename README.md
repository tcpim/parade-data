# parade-data

###
Cloud environment variable needs to have:
- environment: PROD  // for checking prod DB or dev

### Start local cloud auth proxy
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

### Locally test job
```
npm start
```

### Upload to artifact registry
```
gcloud builds submit --pack image=LOCATION-docker.pkg.dev/PROJECT_ID/REPO_NAME/IMAGE_NAME

LOCATION with the region name of your container repository. Example: us-west2
PROJECT_ID with the ID of your Cloud project.
REPO_NAME with the name of your Docker repository.
IMAGE_NAME with the name of your container image.

gcloud builds submit --pack image=us-west2-docker.pkg.dev/cloud-sql-test-377705/cloud-sql-test/parade-data-job

```