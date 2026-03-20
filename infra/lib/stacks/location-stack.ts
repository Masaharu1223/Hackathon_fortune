import * as cdk from "aws-cdk-lib";
import * as location from "aws-cdk-lib/aws-location";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export class LocationStack extends cdk.Stack {
  public readonly placeIndex: location.CfnPlaceIndex;
  public readonly map: location.CfnMap;
  public readonly identityPool: cognito.CfnIdentityPool;
  public readonly identityPoolId: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ── Place Index (ジオコーディング + サジェスト) ──────────────────
    this.placeIndex = new location.CfnPlaceIndex(this, "PlaceIndex", {
      indexName: `${id}-PlaceIndex`,
      dataSource: "Esri",
      dataSourceConfiguration: {
        intendedUse: "SingleUse",
      },
      description: "一番くじアプリ: 店舗住所のジオコーディングとサジェスト",
    });

    // ── Map Resource (地図タイル) ──────────────────────────────────
    this.map = new location.CfnMap(this, "Map", {
      mapName: `${id}-Map`,
      configuration: {
        style: "VectorEsriNavigation",
      },
      description: "一番くじアプリ: 地図表示用",
    });

    // ── Identity Pool (未認証アクセス用) ──────────────────────────────
    this.identityPool = new cognito.CfnIdentityPool(this, "IdentityPool", {
      identityPoolName: `${id}IdentityPool`,
      allowUnauthenticatedIdentities: true,
    });

    this.identityPoolId = this.identityPool.ref;

    // ── IAM Role for Unauthenticated Users ────────────────────────────
    const unauthRole = new iam.Role(this, "UnauthRole", {
      assumedBy: new iam.FederatedPrincipal(
        "cognito-identity.amazonaws.com",
        {
          StringEquals: {
            "cognito-identity.amazonaws.com:aud": this.identityPoolId,
          },
          "ForAnyValue:StringLike": {
            "cognito-identity.amazonaws.com:amr": "unauthenticated",
          },
        },
        "sts:AssumeRoleWithWebIdentity",
      ),
    });

    // 地図リソースへのアクセス権限
    unauthRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "geo:GetMap*",
          "geo:GetMapStyleDescriptor",
          "geo:GetMapGlyphs",
          "geo:GetMapSprites",
          "geo:GetMapTile",
        ],
        resources: [this.map.attrArn],
      }),
    );

    // Identity Poolにロールをアタッチ
    new cognito.CfnIdentityPoolRoleAttachment(this, "IdentityPoolRoleAttachment", {
      identityPoolId: this.identityPoolId,
      roles: {
        unauthenticated: unauthRole.roleArn,
      },
    });

    // ── Outputs ────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, "PlaceIndexName", {
      value: this.placeIndex.indexName,
    });

    new cdk.CfnOutput(this, "MapName", {
      value: this.map.mapName,
    });

    new cdk.CfnOutput(this, "IdentityPoolId", {
      value: this.identityPoolId,
    });

    new cdk.CfnOutput(this, "Region", {
      value: this.region,
    });
  }
}
