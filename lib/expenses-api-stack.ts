import * as path from 'path';

import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime, StartingPosition } from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager'
import { PublicHostedZone } from 'aws-cdk-lib/aws-route53'
import { EventBus } from 'aws-cdk-lib/aws-events';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { HttpApi, HttpMethod, DomainName } from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';

export class ExpensesApiStack extends Stack {
  #expensesEventBus: EventBus;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const domain = 'knut.ar';

    // create knut hosted zone
    const myHostedZone = new PublicHostedZone(this, 'KnutHostedZone', {
      zoneName: domain,
    });
    const certificate = new Certificate(this, 'Certificate', {
      domainName: domain,
      validation: CertificateValidation.fromDns(myHostedZone),
    });

    // create domain name
    const domainName = new DomainName(this, 'DomainName', {
      domainName: domain,
      certificate: Certificate.fromCertificateArn(this, 'cert', certificate.certificateArn),
    });

    // knut event bus
    this.#expensesEventBus = new EventBus(this, 'KnutEventBus', {
      eventBusName: 'knut-event-bus',
    });

    // create dynamodb table to store expenses
    const expensesTable = new dynamodb.Table(this, 'ExpensesTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
      stream: dynamodb.StreamViewType.NEW_IMAGE,
    });

    // dynamodb table stream handler
    const expensesTableStreamHandler = new lambda.NodejsFunction(this, 'ExpensesTableStreamHandler', {
      runtime: Runtime.NODEJS_12_X,
      handler: 'handler',
      entry: path.join(__dirname, '..', 'src', 'lambda', 'expenses-stream-process.ts'),
      environment: {
        EVENT_BUS_NAME: this.#expensesEventBus.eventBusName,
      },
    });

    // register table stream event handler
    expensesTableStreamHandler.addEventSource(new DynamoEventSource(expensesTable, {
      startingPosition: StartingPosition.TRIM_HORIZON,
      batchSize: 5,
      retryAttempts: 10,
    }));

    // create a lambda handler to store expenses inside dynamodb
    const createExpensesHandler = new lambda.NodejsFunction(this, 'ExpenseStoreHandler', {
      runtime: Runtime.NODEJS_14_X,
      handler: 'handler',
      entry: path.join(__dirname, '..', 'src', 'lambda', 'expenses-store.ts'),
      environment: {
        EXPENSES_TABLE_NAME: expensesTable.tableName,
      },
    });

    // grants write access to the table
    expensesTable.grantWriteData(createExpensesHandler);

    // create api gateway to expose the lambda handler
    const api = new HttpApi(this, 'ExpensesApi', {
      defaultDomainMapping: {
        domainName: domainName,
        mappingKey: 'expenses',
      },
    });
    api.addRoutes({
      path: '/expenses',
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration('createExpensesHandler', createExpensesHandler),
    });

    // grants putEvent access to stream handler
    this.#expensesEventBus.grantPutEventsTo(expensesTableStreamHandler);
  }

  getExpensesEventBus() {
    return this.#expensesEventBus;
  }
}
