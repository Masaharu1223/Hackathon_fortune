import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import * as path from "path";

interface NotificationStackProps extends cdk.StackProps {
  mainTable: dynamodb.Table;
}

export class NotificationStack extends cdk.Stack {
  public readonly queue: sqs.Queue;

  constructor(scope: Construct, id: string, props: NotificationStackProps) {
    super(scope, id, props);

    const { mainTable } = props;

    const backendSrc = path.join(__dirname, "../../../packages/backend/src");

    // ── Dead-letter queue ──────────────────────────────────────────────
    const dlq = new sqs.Queue(this, "NotificationDLQ", {
      queueName: `${id}-NotificationDLQ`,
      retentionPeriod: cdk.Duration.days(14),
    });

    // ── Notification queue ─────────────────────────────────────────────
    this.queue = new sqs.Queue(this, "NotificationQueue", {
      queueName: `${id}-NotificationQueue`,
      visibilityTimeout: cdk.Duration.seconds(60),
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 3,
      },
    });

    // ── Notification Lambda ────────────────────────────────────────────
    const notificationHandler = new NodejsFunction(
      this,
      "NotificationHandler",
      {
        functionName: `${id}-NotificationHandler`,
        runtime: Runtime.NODEJS_20_X,
        entry: path.join(backendSrc, "handlers/notification.ts"),
        memorySize: 256,
        timeout: cdk.Duration.seconds(30),
        environment: {
          TABLE_NAME: mainTable.tableName,
        },
        bundling: {
          externalModules: ["@aws-sdk/*"],
        },
      },
    );

    // Grant DynamoDB read access (to look up user notification preferences)
    mainTable.grantReadData(notificationHandler);

    // Wire SQS → Lambda
    notificationHandler.addEventSource(
      new lambdaEventSources.SqsEventSource(this.queue, {
        batchSize: 10,
        maxBatchingWindow: cdk.Duration.seconds(5),
        reportBatchItemFailures: true,
      }),
    );

    // ── Outputs ────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, "NotificationQueueUrl", {
      value: this.queue.queueUrl,
    });
    new cdk.CfnOutput(this, "NotificationQueueArn", {
      value: this.queue.queueArn,
    });
  }
}
