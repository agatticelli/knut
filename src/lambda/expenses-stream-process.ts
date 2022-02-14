import { DynamoDBStreamEvent } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

import { noContent } from '../utils/responses';

// create a lambda handler to process dynamodb stream
const handler = async (event: DynamoDBStreamEvent) => {
  const expensesCreated = [];
  for (const record of event.Records) {
    if (record.eventName === 'INSERT') {
      const expense = DynamoDB.Converter.unmarshall(record.dynamodb!.NewImage!);
      expensesCreated.push(expense);
    }
  }

  console.log(expensesCreated);

  return noContent();
};

export { handler };
