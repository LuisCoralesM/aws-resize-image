export interface Event {
  Records: Record[];
}

export interface Record {
  eventVersion: string;
  eventSource: string;
  awsRegion: string;
  eventTime: string;
  eventName: string;
  userIdentity: UserIdentity;
  requestParameters: RequestParameters;
  responseElements: ResponseElements;
  s3: S3;
}

export interface UserIdentity {
  principalId: string;
}

export interface RequestParameters {
  sourceIPAddress: string;
}

export interface ResponseElements {
  "x-amz-request-id": string;
  "x-amz-id-2": string;
}

export interface S3 {
  s3SchemaVersion: string;
  configurationId: string;
  bucket: Bucket;
  object: Object;
}

export interface Bucket {
  name: string;
  ownerIdentity: OwnerIdentity;
  arn: string;
}

export interface OwnerIdentity {
  principalId: string;
}

export interface Object {
  key: string;
  size: number;
  eTag: string;
  sequencer: string;
}
