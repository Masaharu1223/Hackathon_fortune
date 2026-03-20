#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { AuthStack } from "../lib/stacks/auth-stack";
import { DatabaseStack } from "../lib/stacks/database-stack";
import { LocationStack } from "../lib/stacks/location-stack";
import { ApiStack } from "../lib/stacks/api-stack";
import { NotificationStack } from "../lib/stacks/notification-stack";
import { SchedulerStack } from "../lib/stacks/scheduler-stack";
import { FrontendStack } from "../lib/stacks/frontend-stack";

const app = new cdk.App();

const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? "ap-northeast-1",
};

const stage = app.node.tryGetContext("stage") ?? "dev";

// Auth stack skipped — deploy without Cognito for now
// const auth = new AuthStack(app, `${stage}-IchibanKuji-Auth`, { env });

const database = new DatabaseStack(app, `${stage}-IchibanKuji-Database`, {
  env,
});

const location = new LocationStack(app, `${stage}-IchibanKuji-Location`, {
  env,
});

const notification = new NotificationStack(
  app,
  `${stage}-IchibanKuji-Notification`,
  {
    env,
    mainTable: database.mainTable,
  },
);

const api = new ApiStack(app, `${stage}-IchibanKuji-Api`, {
  env,
  mainTable: database.mainTable,
  geoTable: database.geoTable,
  notificationQueue: notification.queue,
  placeIndex: location.placeIndex,
});

new SchedulerStack(app, `${stage}-IchibanKuji-Scheduler`, {
  env,
  mainTable: database.mainTable,
  geoTable: database.geoTable,
  notificationQueue: notification.queue,
});

new FrontendStack(app, `${stage}-IchibanKuji-Frontend`, {
  env,
  api: api.api,
  locationMap: location.map,
  identityPoolId: location.identityPoolId,
});

app.synth();
