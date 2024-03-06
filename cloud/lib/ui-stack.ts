import {
	AllowedMethods,
	CacheCookieBehavior,
	CachePolicy,
	Distribution,
	OriginAccessIdentity,
	SecurityPolicyProtocol,
	ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { CfnOutput, Duration, RemovalPolicy, Stack, StackProps, } from 'aws-cdk-lib/core';
import * as iam from 'aws-cdk-lib/aws-iam';
import { BlockPublicAccess, Bucket, BucketEncryption, } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

import { appName, resourceName } from './resourceNamingUtils';
import { AaaaRecord, IHostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { ICertificate } from 'aws-cdk-lib/aws-certificatemanager';

type UiStackProps = StackProps & {
	certificate: ICertificate;
	hostedZone: IHostedZone;
}

export class UiStack extends Stack {
	public readonly cloudFrontUrl: string;

	constructor(scope: Construct, id: string, props: UiStackProps) {
		super(scope, id, props);

		const generateResourceName = resourceName(scope);
		const { certificate, hostedZone } = props;

		const cloudfrontOAI = new OriginAccessIdentity(
			this,
			generateResourceName('cloudfront-OAI')
		);

		// Host Bucket
		const bucketName = generateResourceName('host-bucket');
		const hostBucket = new Bucket(this, bucketName, {
			bucketName,
			blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
			encryption: BucketEncryption.S3_MANAGED,
			versioned: false,
			removalPolicy: RemovalPolicy.DESTROY,
			autoDeleteObjects: true,
		});
		hostBucket.addToResourcePolicy(
			new iam.PolicyStatement({
				actions: ['s3:GetObject'],
				resources: [hostBucket.arnForObjects('*')],
				principals: [
					new iam.CanonicalUserPrincipal(
						cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
					),
				],
			})
		);

		// CloudFront Distribution
		const cachePolicyName = generateResourceName('site-cache-policy');
		const cloudFrontDistribution = new Distribution(
			this,
			generateResourceName('site-distribution'),
			{
				defaultRootObject: 'index.html',
				minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
				certificate,
				domainNames: [hostedZone.zoneName],
				errorResponses: [
					{
						httpStatus: 404,
						responseHttpStatus: 200,
						responsePagePath: '/index.html',
						ttl: Duration.seconds(30),
					},
				],
				defaultBehavior: {
					origin: new S3Origin(hostBucket, {
						originAccessIdentity: cloudfrontOAI,
					}),
					cachePolicy: new CachePolicy(this, cachePolicyName, {
						cachePolicyName,
						cookieBehavior: CacheCookieBehavior.allowList(`${appName}.sid`),
					}),
					compress: true,
					allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
					viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
				},

			}
		);

		// DNS AAAA Record for Route53
		const cloudFrontARecordName = generateResourceName('arecord-cfront');
		new AaaaRecord(this, cloudFrontARecordName, {
			zone: hostedZone,
			target: RecordTarget.fromAlias(new CloudFrontTarget(cloudFrontDistribution)),
			deleteExisting: true,
			comment: 'DNS AAAA Record for the UI host',
		});

		this.cloudFrontUrl = `https://${cloudFrontDistribution.domainName}`;
		new CfnOutput(this, 'WebURL', {
			value: this.cloudFrontUrl,
		});
	}
}
