import * as path from 'path';

import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime, StartingPosition } from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import { EventBus } from 'aws-cdk-lib/aws-events';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

export class ExpensesApiStack extends Stack {
  #expensesEventBus: EventBus;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

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
        TABLE_NAME: expensesTable.tableName,
      },
    });

    // create a lambda handler to retrieve expenses from dynamodb

    // create api gateway to expose the lambda handler
    const api = new apigw.RestApi(this, 'ExpensesApi');
    const expensesApi = api.root.addResource('expenses');
    expensesApi.addMethod('POST', new apigw.LambdaIntegration(createExpensesHandler));

    // grants write access to the table
    expensesTable.grantWriteData(createExpensesHandler);

    // grants putEvent access to stream handler
    this.#expensesEventBus.grantPutEventsTo(expensesTableStreamHandler);
  }

  getExpensesEventBus() {
    return this.#expensesEventBus;
  }
}
