import { DynamoDB, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from 'uuid';

import { created, internalServerError } from '../utils/responses';
import { DynamoExpense, StoreExpenseHandlerProps } from '../types/expenses';

const dynamoClient = new DynamoDB({});

// create a lambda handler to store expenses inside dynamodb
const handler = async (event: any) => {
  const body = JSON.parse(event.body) as StoreExpenseHandlerProps;

  // parse the event body
  const expenseId = uuidv4();
  const expenseData: DynamoExpense = {
    id: { S: expenseId },
    username: { S: body.username },
    category: { S: body.category },
    description: { S: body.description },
    place: { S: body.place },
    currency: { S: body.currency },
    creation_date: { S: new Date(body.creation_date).toISOString() },
    payment_method: { S: body.payment_method },
    first_impact_date: { S: new Date(body.first_impact_date).toISOString() },
    installments: { N: body.installments.toString() },
    bank: { S: body.bank },
    card_issuer: { S: body.card_issuer },
    price: { N: body.price.toFixed(2) },
  };

  // store the expense in dynamodb
  try {
    const command = new PutItemCommand({
      TableName: process.env.EXPENSES_TABLE_NAME!,
      Item: expenseData,
    });

    await dynamoClient.send(command);

    return created({ id: expenseId });
  } catch (error) {
    console.error('Failed to create expense', error);
    return internalServerError();
  }
};

export { handler };
