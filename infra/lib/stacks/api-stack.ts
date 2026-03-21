import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import * as path from "path";

interface ApiStackProps extends cdk.StackProps {
  userPool: cognito.IUserPool;
  mainTable: dynamodb.Table;
  geoTable: dynamodb.Table;
  notificationQueue: sqs.Queue;
}

export class ApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { userPool, mainTable, geoTable, notificationQueue } = props;

    const commonEnv: Record<string, string> = {
      TABLE_NAME: mainTable.tableName,
      GEO_TABLE_NAME: geoTable.tableName,
      NOTIFICATION_QUEUE_URL: notificationQueue.queueUrl,
      ADMIN_EMAIL_ALLOWLIST: process.env.ADMIN_EMAIL_ALLOWLIST ?? "",
    };

    const backendSrc = path.join(__dirname, "../../../packages/backend/src");

    const nodejsFnProps = {
      runtime: Runtime.NODEJS_20_X,
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      environment: commonEnv,
      bundling: {
        externalModules: ["@aws-sdk/*"],
      },
    };

    // ── Lambda Functions ───────────────────────────────────────────────
    const usersHandler = new NodejsFunction(this, "UsersHandler", {
      ...nodejsFnProps,
      functionName: `${id}-UsersHandler`,
      entry: path.join(backendSrc, "handlers/users.ts"),
    });

    const storesHandler = new NodejsFunction(this, "StoresHandler", {
      ...nodejsFnProps,
      functionName: `${id}-StoresHandler`,
      entry: path.join(backendSrc, "handlers/stores.ts"),
    });

    const reservationHandler = new NodejsFunction(this, "ReservationHandler", {
      ...nodejsFnProps,
      functionName: `${id}-ReservationHandler`,
      entry: path.join(backendSrc, "handlers/reservation.ts"),
    });

    const adminHandler = new NodejsFunction(this, "AdminHandler", {
      ...nodejsFnProps,
      functionName: `${id}-AdminHandler`,
      entry: path.join(backendSrc, "handlers/admin.ts"),
    });

    // ── IAM grants ─────────────────────────────────────────────────────
    for (const fn of [usersHandler, storesHandler, reservationHandler, adminHandler]) {
      mainTable.grantReadWriteData(fn);
      geoTable.grantReadWriteData(fn);
      notificationQueue.grantSendMessages(fn);
    }

    // ── API Gateway ────────────────────────────────────────────────────
    this.api = new apigateway.RestApi(this, "Api", {
      restApiName: `${id}-Api`,
      deployOptions: {
        stageName: "prod",
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          "Content-Type",
          "Authorization",
          "X-Amz-Date",
          "X-Api-Key",
        ],
      },
    });

    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(
      this,
      "ApiAuthorizer",
      {
        cognitoUserPools: [userPool],
      },
    );

    const protectedMethodOptions: apigateway.MethodOptions = {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    };

    // ── Lambda integrations ────────────────────────────────────────────
    const usersIntegration = new apigateway.LambdaIntegration(usersHandler);
    const storesIntegration = new apigateway.LambdaIntegration(storesHandler);
    const reservationIntegration = new apigateway.LambdaIntegration(reservationHandler);
    const adminIntegration = new apigateway.LambdaIntegration(adminHandler);

    // ── Resource tree ──────────────────────────────────────────────────
    const apiRoot = this.api.root.addResource("api");
    const v1 = apiRoot.addResource("v1");

    // /api/v1/users
    const users = v1.addResource("users");
    const usersMe = users.addResource("me");
    usersMe.addMethod("GET", usersIntegration, protectedMethodOptions);

    // /api/v1/users/me/watchlist
    const watchlist = usersMe.addResource("watchlist");
    watchlist.addMethod("GET", usersIntegration, protectedMethodOptions);
    watchlist.addMethod("POST", usersIntegration, protectedMethodOptions);

    // /api/v1/users/me/watchlist/{seriesId}
    const watchlistSeries = watchlist.addResource("{seriesId}");
    watchlistSeries.addMethod("DELETE", usersIntegration, protectedMethodOptions);

    // /api/v1/users/me/reservations
    const userReservations = usersMe.addResource("reservations");
    userReservations.addMethod("GET", usersIntegration, protectedMethodOptions);

    // /api/v1/stores
    const stores = v1.addResource("stores");

    // /api/v1/stores/nearby  (PUBLIC — no authorizer)
    const storesNearby = stores.addResource("nearby");
    storesNearby.addMethod("GET", storesIntegration);

    // /api/v1/stores/{storeId}
    const storeById = stores.addResource("{storeId}");
    storeById.addMethod("GET", storesIntegration);

    // /api/v1/stores/{storeId}/kuji/{seriesId}/reserve
    const kuji = storeById.addResource("kuji");
    const kujiSeries = kuji.addResource("{seriesId}");
    const reserve = kujiSeries.addResource("reserve");
    reserve.addMethod("POST", reservationIntegration, protectedMethodOptions);
    reserve.addMethod("DELETE", reservationIntegration, protectedMethodOptions);

    // /api/v1/admin
    const admin = v1.addResource("admin");
    const adminStores = admin.addResource("stores");
    adminStores.addMethod("POST", adminIntegration, protectedMethodOptions);

    // /api/v1/admin/stores/{storeId}
    const adminStoreById = adminStores.addResource("{storeId}");
    adminStoreById.addMethod("PUT", adminIntegration, protectedMethodOptions);

    // /api/v1/admin/stores/{storeId}/kuji
    const adminKuji = adminStoreById.addResource("kuji");
    adminKuji.addMethod("POST", adminIntegration, protectedMethodOptions);

    // /api/v1/admin/stores/{storeId}/kuji/{seriesId}
    const adminKujiSeries = adminKuji.addResource("{seriesId}");
    adminKujiSeries.addMethod("PUT", adminIntegration, protectedMethodOptions);

    // /api/v1/admin/stores/{storeId}/kuji/{seriesId}/reservations
    const adminReservations = adminKujiSeries.addResource("reservations");
    adminReservations.addMethod("GET", adminIntegration, protectedMethodOptions);

    // ── Outputs ────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, "ApiUrl", {
      value: this.api.url,
    });
  }
}
