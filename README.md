# aws-resize-image

Upload images and get them resized in 3 variants, all using serverless code!

## Features

- Supported images: PNG & JPG
- Get them in the next sized:
  - 400x300
  - 160x120
  - 120x120
- Serverless code using AWS

## Services used

- S3
- Lambda
- API Gateway
- Eventbridge
- DynamoDB

## Deployment

Run the following commands and wait until the packages are downloaded and the code deployed.

```
yarn install & cdk deploy
```

# How to use it?

## Postman

You can import [this file](aws-resize-image_postman_collection.json) into Postman. This contains the documentation of the requests and endpoints but also some automation with the use of scripts to avoid wasting time adding values.

1. Request to get presigned url

2. Request to upload image

3. Request to get all images listed

4. Request to get one image listed by id

5. Request to delete one image by id


## Architecture

Diagram of the AWS architecture