import {
	Certificate,
	CertificateValidation,
	DnsValidatedCertificate,
	ICertificate,
} from 'aws-cdk-lib/aws-certificatemanager';
import { IHostedZone } from 'aws-cdk-lib/aws-route53';
import { Stack, StackProps } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';

import { resourceId } from './resourceNamingUtils';

type CertificateStackProps = StackProps & {
	domainName: string;
	hostedZone: IHostedZone;
};

export class CertificateStack extends Stack {
	public readonly apiDomainName: string;
	public readonly cloudFrontCert: ICertificate;
	public readonly loadBalancerCert: ICertificate;

	constructor(scope: Construct, id: string, props: CertificateStackProps) {
		super(scope, id, props);

		const { domainName, hostedZone } = props;
		const generateResourceId = resourceId(scope);
		const validation = CertificateValidation.fromDns(hostedZone);
		this.apiDomainName = `api.${domainName}`;

		// Yes this is deprecated, but CDK currently gives us no way to use
		// Permissions Boundaries with cross-region resources, so ...
		this.cloudFrontCert = new DnsValidatedCertificate(this, generateResourceId('cert-ui'), {
			domainName,
			hostedZone,
			validation,
			region: 'us-east-1',
		});

		this.loadBalancerCert = new Certificate(this, generateResourceId('cert-alb'), {
			domainName: this.apiDomainName,
			validation,
		});
	}
}
