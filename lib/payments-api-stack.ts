import * as path from 'path';

import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { EventBus, Rule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';

interface PaymentsApiStackProps extends StackProps {
  expensesEventBus: EventBus;
}
  

export class PaymentsApiStack extends Stack {
  constructor(scope: Construct, id: string, props: PaymentsApiStackProps) {
    super(scope, id, props);

    // create dynamodb table to store payments
    const paymentsTable = new dynamodb.Table(this, 'PaymentsTable', {
      partitionKey: { name: 'expense_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'installment_number', type: dynamodb.AttributeType.NUMBER },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // create a lambda handler to store payments inside dynamodb
    const createPaymentsHandler = new lambda.NodejsFunction(this, 'PaymentsStoreHandler', {
      runtime: Runtime.NODEJS_14_X,
      handler: 'handler',
      entry: path.join(__dirname, '..', 'src', 'lambda', 'payments-store.ts'),
      environment: {
        PAYMENTS_TABLE_NAME: paymentsTable.tableName,
      },
    });

    // grants write access to the table
    paymentsTable.grantWriteData(createPaymentsHandler);

    // generate event bus rule
    new Rule(this, 'ExpenseCreatedRule', {
      eventPattern: {
        detailType: ['expense:created'],
      },
      eventBus: props.expensesEventBus,
      targets: [
        new LambdaFunction(createPaymentsHandler),
      ],
    });
  }
}
