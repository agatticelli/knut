#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ExpensesApiStack } from '../lib/expenses-api-stack';
import { PaymentsApiStack } from '../lib/payments-api-stack';

const app = new cdk.App();
const expensesStack = new ExpensesApiStack(app, 'ExpensesApiStack');
new PaymentsApiStack(app, 'PaymentsApiStack', {
  expensesEventBus: expensesStack.getExpensesEventBus(),
});