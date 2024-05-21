import {
  App,
  RemovalPolicy,
  Stack,
  aws_lambda_event_sources,
  aws_sqs,
} from "aws-cdk-lib";
import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import { Architecture, Runtime } from "aws-cdk-lib/aws-lambda";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import * as s3 from "aws-cdk-lib/aws-s3";
import { LambdaDestination } from "aws-cdk-lib/aws-s3-notifications";
import { join } from "path";

const lambdasPath = "../lambdas";

export class ApiLambdaCrudDynamoDBStack extends Stack {
  constructor(app: App, id: string) {
    super(app, id);

    const s3BucketOriginal = new s3.Bucket(this, "originalImages", {
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const s3BucketResized = new s3.Bucket(this, "resizedImages", {
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    s3BucketResized.grantRead(new iam.AccountRootPrincipal());

    const dynamoTable = new Table(this, "items", {
      partitionKey: {
        name: "itemId",
        type: AttributeType.STRING,
      },
      tableName: "items",

      /**
       *  The default removal policy is RETAIN, which means that cdk destroy will not attempt to delete
       * the new table, and it will remain in your account until manually deleted. By setting the policy to
       * DESTROY, cdk destroy will delete the table (even if it has data in it)
       */
      removalPolicy: RemovalPolicy.DESTROY, // NOT recommended for production code
    });

    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: [
          "aws-sdk", // Use the 'aws-sdk' available in the Lambda runtime
        ],
      },
      environment: {
        PRIMARY_KEY: "itemId",
        TABLE_NAME: dynamoTable.tableName,
      },
      runtime: Runtime.NODEJS_20_X,
    };

    // Create a Lambda function for each of the CRUD operations
    const getOneLambda = new NodejsFunction(this, "getOneItemFunction", {
      entry: join(__dirname, lambdasPath, "get-one.ts"),
      ...nodeJsFunctionProps,
    });
    const getAllLambda = new NodejsFunction(this, "getAllItemsFunction", {
      entry: join(__dirname, lambdasPath, "get-all.ts"),
      ...nodeJsFunctionProps,
    });
    const createOneLambda = new NodejsFunction(this, "createItemFunction", {
      entry: join(__dirname, lambdasPath, "create.ts"),
      ...nodeJsFunctionProps,
      environment: { S3_BUCKET: s3BucketOriginal.bucketName },
    });
    const deleteOneLambda = new NodejsFunction(this, "deleteItemFunction", {
      entry: join(__dirname, lambdasPath, "delete-one.ts"),
      ...nodeJsFunctionProps,
    });
    const resizeImageLambda = new NodejsFunction(this, "resizeImageFunction", {
      entry: join(__dirname, lambdasPath, "resize-image.ts"),
      ...nodeJsFunctionProps,
      bundling: {
        nodeModules: ["sharp"],
      },
      architecture: Architecture.X86_64,
    });

    const queue = new aws_sqs.Queue(this, "resizeImageQueue", {});

    const lambdaEventSource = new aws_lambda_event_sources.SqsEventSource(
      queue,
      {
        batchSize: 1,
      }
    );
    resizeImageLambda.addEventSource(lambdaEventSource);

    s3BucketOriginal.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new LambdaDestination(resizeImageLambda)
    );

    // Grant the Lambda function read access to the DynamoDB table
    dynamoTable.grantReadWriteData(getAllLambda);
    dynamoTable.grantReadWriteData(getOneLambda);
    dynamoTable.grantReadWriteData(createOneLambda);
    dynamoTable.grantReadWriteData(deleteOneLambda);

    // Integrate the Lambda functions with the API Gateway resource
    const getAllIntegration = new LambdaIntegration(getAllLambda);
    const createOneIntegration = new LambdaIntegration(createOneLambda);
    const getOneIntegration = new LambdaIntegration(getOneLambda);
    const deleteOneIntegration = new LambdaIntegration(deleteOneLambda);

    // Create an API Gateway resource for each of the CRUD operations
    const api = new RestApi(this, "itemsApi", {
      restApiName: "Items Service",
      // In case you want to manage binary types, uncomment the following
      // binaryMediaTypes: ["*/*"],
    });

    const items = api.root.addResource("items");
    items.addMethod("GET", getAllIntegration);
    items.addMethod("POST", createOneIntegration);

    const singleItem = items.addResource("{id}");
    singleItem.addMethod("GET", getOneIntegration);
    singleItem.addMethod("DELETE", deleteOneIntegration);

    s3BucketOriginal.grantReadWrite(createOneLambda);
  }
}

const app = new App();
new ApiLambdaCrudDynamoDBStack(app, "ApiLambdaResizeImage");
app.synth();