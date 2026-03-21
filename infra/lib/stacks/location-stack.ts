import * as cdk from "aws-cdk-lib";
import * as location from "aws-cdk-lib/aws-location";
import { Construct } from "constructs";

export class LocationStack extends cdk.Stack {
  public readonly placeIndex: location.CfnPlaceIndex;

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

    // ── Outputs ────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, "PlaceIndexName", {
      value: this.placeIndex.indexName,
    });
  }
}
