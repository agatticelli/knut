import { DynamoDBStreamEvent } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

import { createEvents } from '../utils/event-bride';
import { noContent } from '../utils/responses';

// create a lambda handler to process dynamodb stream
const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  const expensesCreated = [];
  for (const record of event.Records) {
    if (record.eventName === 'INSERT') {
      const expense = DynamoDB.Converter.unmarshall(record.dynamodb!.NewImage!);
      expensesCreated.push(expense);
    }
  }

  await createEvents(process.env.EVENT_BUS_NAME!, "expense:created", expensesCreated);
};

export { handler };
