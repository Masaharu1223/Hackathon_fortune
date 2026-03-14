import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";

interface SchedulerStackProps extends cdk.StackProps {
  mainTable: dynamodb.Table;
  geoTable: dynamodb.Table;
  notificationQueue: sqs.Queue;
}

export class SchedulerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SchedulerStackProps) {
    super(scope, id, props);

    const { mainTable, geoTable, notificationQueue } = props;

    // ── Lottery Lambda ─────────────────────────────────────────────────
    const lotteryHandler = new lambda.Function(this, "LotteryHandler", {
      functionName: `${id}-LotteryHandler`,
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset("../packages/backend/dist"),
      handler: "handlers/lottery.handler",
      memorySize: 512,
      timeout: cdk.Duration.minutes(5),
      environment: {
        TABLE_NAME: mainTable.tableName,
        GEO_TABLE_NAME: geoTable.tableName,
        NOTIFICATION_QUEUE_URL: notificationQueue.queueUrl,
      },
    });

    mainTable.grantReadWriteData(lotteryHandler);
    geoTable.grantReadWriteData(lotteryHandler);
    notificationQueue.grantSendMessages(lotteryHandler);

    // ── EventBridge daily schedule (JST 10:00 = UTC 01:00) ─────────────
    const rule = new events.Rule(this, "DailyLotteryRule", {
      ruleName: `${id}-DailyLotteryRule`,
      schedule: events.Schedule.cron({
        minute: "0",
        hour: "1",
        day: "*",
        month: "*",
        year: "*",
      }),
    });

    rule.addTarget(new targets.LambdaFunction(lotteryHandler));
  }
}
