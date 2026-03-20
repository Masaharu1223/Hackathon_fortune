import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as location from "aws-cdk-lib/aws-location";
import { Construct } from "constructs";

interface FrontendStackProps extends cdk.StackProps {
  api: apigateway.RestApi;
  locationMap?: location.CfnMap;
  identityPoolId?: string;
}

export class FrontendStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);

    const { api, locationMap, identityPoolId } = props;

    // ── S3 Bucket (private — accessed only via CloudFront OAC) ────────
    this.bucket = new s3.Bucket(this, "FrontendBucket", {
      bucketName: `${id.toLowerCase()}-frontend-${cdk.Aws.ACCOUNT_ID}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // ── API Gateway origin ─────────────────────────────────────────────
    // Extract the domain and stage from the API URL
    const apiDomain = `${api.restApiId}.execute-api.${cdk.Aws.REGION}.amazonaws.com`;
    const apiOrigin = new origins.HttpOrigin(apiDomain, {
      originPath: `/${api.deploymentStage.stageName}`,
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
    });

    // ── S3 origin with OAC ─────────────────────────────────────────────
    const s3Origin = origins.S3BucketOrigin.withOriginAccessControl(
      this.bucket,
    );

    // ── CloudFront Distribution ────────────────────────────────────────
    this.distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultRootObject: "index.html",
      defaultBehavior: {
        origin: s3Origin,
        viewerProtocolPolicy:
          cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      additionalBehaviors: {
        "/api/*": {
          origin: apiOrigin,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy:
            cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
      },
      // SPA fallback: serve index.html for 403/404 from S3
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: cdk.Duration.seconds(0),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: cdk.Duration.seconds(0),
        },
      ],
    });

    // ── Outputs ────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, "DistributionDomainName", {
      value: this.distribution.distributionDomainName,
    });
    new cdk.CfnOutput(this, "BucketName", {
      value: this.bucket.bucketName,
    });

    // AWS Location Service outputs for frontend
    if (locationMap) {
      new cdk.CfnOutput(this, "LocationMapName", {
        value: locationMap.mapName,
        description: "AWS Location Service Map Name",
      });
    }
    if (identityPoolId) {
      new cdk.CfnOutput(this, "IdentityPoolId", {
        value: identityPoolId,
        description: "Cognito Identity Pool ID for map access",
      });
    }
    new cdk.CfnOutput(this, "Region", {
      value: this.region,
      description: "AWS Region",
    });
  }
}
