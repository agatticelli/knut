import { unmarshall } from '@aws-sdk/util-dynamodb';

import { createEvents } from '../utils/event-bride';

// create a lambda handler to process dynamodb stream
const handler = async (event: any): Promise<void> => {
  const expensesCreated = [];
  for (const record of event.Records) {
    if (record.eventName === 'INSERT') {
      const expense = unmarshall(record.dynamodb!.NewImage!);
      expensesCreated.push(expense);
    }
  }

  await createEvents(process.env.EVENT_BUS_NAME!, "expense:created", expensesCreated);
};

export { handler };
