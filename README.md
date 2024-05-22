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
![image](https://github.com/LuisCoralesM/aws-resize-image/assets/101592507/7c944e2f-50c6-49f5-bda2-6d43b2e8d0fa)

2. Request to upload image, add `Content-Type` and `file` with your image
![image](https://github.com/LuisCoralesM/aws-resize-image/assets/101592507/79021fa7-e34a-4a39-860b-ca59fbdbe9a8)

3. Request to get all images listed
![image](https://github.com/LuisCoralesM/aws-resize-image/assets/101592507/6e5fe0dc-ac55-4338-9edf-b39e3e763045)

4. Request to get one image listed by id
![image](https://github.com/LuisCoralesM/aws-resize-image/assets/101592507/ffbd7401-f1ca-4257-8d94-69a501260ef4)

5. Request to delete one image by id
![image](https://github.com/LuisCoralesM/aws-resize-image/assets/101592507/33e9edf5-25b7-4df1-a134-245d18b88f48)


## Architecture

Diagram of the AWS architecture

![aws-resize-image-arch](https://github.com/LuisCoralesM/aws-resize-image/assets/101592507/f707b3f5-6406-4514-b48b-c0b0865e1360)
