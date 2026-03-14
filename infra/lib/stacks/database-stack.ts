import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export class DatabaseStack extends cdk.Stack {
  public readonly mainTable: dynamodb.Table;
  public readonly geoTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ── Main Single-Table ──────────────────────────────────────────────
    this.mainTable = new dynamodb.Table(this, "IchibanKujiTable", {
      tableName: `${id}-IchibanKujiTable`,
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    // GSI1
    this.mainTable.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: { name: "GSI1PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "GSI1SK", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI2
    this.mainTable.addGlobalSecondaryIndex({
      indexName: "GSI2",
      partitionKey: { name: "GSI2PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "GSI2SK", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI3
    this.mainTable.addGlobalSecondaryIndex({
      indexName: "GSI3",
      partitionKey: { name: "GSI3PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "GSI3SK", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ── Store Geo Table (for dynamodb-geo-v3) ──────────────────────────
    this.geoTable = new dynamodb.Table(this, "StoreGeoTable", {
      tableName: `${id}-StoreGeoTable`,
      partitionKey: { name: "hashKey", type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: "rangeKey", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // dynamodb-geo-v3 expects a GSI on geohash for radius queries
    this.geoTable.addGlobalSecondaryIndex({
      indexName: "geohash-index",
      partitionKey: { name: "hashKey", type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: "geohash", type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ── Outputs ────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, "MainTableName", {
      value: this.mainTable.tableName,
    });
    new cdk.CfnOutput(this, "GeoTableName", {
      value: this.geoTable.tableName,
    });
  }
}
