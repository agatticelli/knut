import { DynamoDB } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

import { created, internalServerError } from '../utils/responses';

type StoreExpenseHandlerProps = {
  username: string;
  category: string;
  description: string;
  place: string;
  currency: string;
  creation_date: string;
  payment_method: string;
  first_impact_date: string;
  installments: number;
  bank: string;
  card_issuer: string;
  price: number;
};

const documentClient = new DynamoDB.DocumentClient();

// create a lambda handler to store expenses inside dynamodb
const handler = async (event: any) => {
  const body = JSON.parse(event.body) as StoreExpenseHandlerProps;

  // parse the event body
  const expenseData = {
    id: uuidv4(),
    username: body.username,
    category: body.category,
    description: body.description,
    place: body.place,
    currency: body.currency,
    creation_date: new Date(body.creation_date).toISOString(),
    payment_method: body.payment_method,
    first_impact_date: new Date(body.first_impact_date).toISOString(),
    installments: body.installments,
    bank: body.bank,
    card_issuer: body.card_issuer,
    price: body.price,
  };

  // store the expense in dynamodb
  try {
    await documentClient.put({
      TableName: process.env.TABLE_NAME!,
      Item: expenseData,
    }).promise();

    return created({ id: expenseData.id });
  } catch (error) {
    console.error('Failed to create expense', error);
    return internalServerError();
  }
};

export { handler };
