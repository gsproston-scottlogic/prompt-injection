#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import 'source-map-support/register';

import {
	appName,
	environmentName,
	resourceDescription,
	stackName,
	ApiStack,
} from '../lib';

const app = new App();
const tags = {
	owner: appName,
	classification: 'unrestricted',
	'environment-type': environmentName(app),
	'keep-alive': '8-6-without-weekends',
	IaC: 'CDK',
};

const generateStackName = stackName(app);
const generateDescription = resourceDescription(app);

new ApiStack(app, generateStackName('api'), {
	tags,
	description: generateDescription('API stack'),
});
