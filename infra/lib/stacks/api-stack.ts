import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";

interface ApiStackProps extends cdk.StackProps {
  userPool: cognito.UserPool;
  userPoolClient: cognito.UserPoolClient;
  mainTable: dynamodb.Table;
  geoTable: dynamodb.Table;
  notificationQueue: sqs.Queue;
}

export class ApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { userPool, mainTable, geoTable, notificationQueue } = props;

    // ── Shared Lambda props ────────────────────────────────────────────
    const commonEnv: Record<string, string> = {
      TABLE_NAME: mainTable.tableName,
      GEO_TABLE_NAME: geoTable.tableName,
      NOTIFICATION_QUEUE_URL: notificationQueue.queueUrl,
    };

    const sharedLambdaProps: Omit<lambda.FunctionProps, "handler" | "functionName"> = {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset("../packages/backend/dist"),
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      environment: commonEnv,
    };

    // ── Lambda Functions ───────────────────────────────────────────────
    const usersHandler = new lambda.Function(this, "UsersHandler", {
      ...sharedLambdaProps,
      functionName: `${id}-UsersHandler`,
      handler: "handlers/users.handler",
    });

    const storesHandler = new lambda.Function(this, "StoresHandler", {
      ...sharedLambdaProps,
      functionName: `${id}-StoresHandler`,
      handler: "handlers/stores.handler",
    });

    const reservationHandler = new lambda.Function(
      this,
      "ReservationHandler",
      {
        ...sharedLambdaProps,
        functionName: `${id}-ReservationHandler`,
        handler: "handlers/reservation.handler",
      },
    );

    const adminHandler = new lambda.Function(this, "AdminHandler", {
      ...sharedLambdaProps,
      functionName: `${id}-AdminHandler`,
      handler: "handlers/admin.handler",
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

    // ── Cognito Authorizer ─────────────────────────────────────────────
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(
      this,
      "CognitoAuthorizer",
      {
        cognitoUserPools: [userPool],
        identitySource: "method.request.header.Authorization",
      },
    );

    const authMethodOptions: apigateway.MethodOptions = {
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
    usersMe.addMethod("GET", usersIntegration, authMethodOptions);

    // /api/v1/users/me/watchlist
    const watchlist = usersMe.addResource("watchlist");
    watchlist.addMethod("GET", usersIntegration, authMethodOptions);
    watchlist.addMethod("POST", usersIntegration, authMethodOptions);

    // /api/v1/users/me/watchlist/{seriesId}
    const watchlistSeries = watchlist.addResource("{seriesId}");
    watchlistSeries.addMethod("DELETE", usersIntegration, authMethodOptions);

    // /api/v1/users/me/reservations
    const userReservations = usersMe.addResource("reservations");
    userReservations.addMethod("GET", usersIntegration, authMethodOptions);

    // /api/v1/stores
    const stores = v1.addResource("stores");

    // /api/v1/stores/nearby  (PUBLIC — no authorizer)
    const storesNearby = stores.addResource("nearby");
    storesNearby.addMethod("GET", storesIntegration);

    // /api/v1/stores/{storeId}
    const storeById = stores.addResource("{storeId}");
    storeById.addMethod("GET", storesIntegration, authMethodOptions);

    // /api/v1/stores/{storeId}/kuji/{seriesId}/reserve
    const kuji = storeById.addResource("kuji");
    const kujiSeries = kuji.addResource("{seriesId}");
    const reserve = kujiSeries.addResource("reserve");
    reserve.addMethod("POST", reservationIntegration, authMethodOptions);
    reserve.addMethod("DELETE", reservationIntegration, authMethodOptions);

    // /api/v1/admin
    const admin = v1.addResource("admin");
    const adminStores = admin.addResource("stores");
    adminStores.addMethod("POST", adminIntegration, authMethodOptions);

    // /api/v1/admin/stores/{storeId}
    const adminStoreById = adminStores.addResource("{storeId}");
    adminStoreById.addMethod("PUT", adminIntegration, authMethodOptions);

    // /api/v1/admin/stores/{storeId}/kuji
    const adminKuji = adminStoreById.addResource("kuji");
    adminKuji.addMethod("POST", adminIntegration, authMethodOptions);

    // /api/v1/admin/stores/{storeId}/kuji/{seriesId}
    const adminKujiSeries = adminKuji.addResource("{seriesId}");
    adminKujiSeries.addMethod("PUT", adminIntegration, authMethodOptions);

    // /api/v1/admin/stores/{storeId}/kuji/{seriesId}/reservations
    const adminReservations = adminKujiSeries.addResource("reservations");
    adminReservations.addMethod("GET", adminIntegration, authMethodOptions);

    // ── Outputs ────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, "ApiUrl", {
      value: this.api.url,
    });
  }
}
