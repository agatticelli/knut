import { DynamoDB, BatchWriteItemCommand } from "@aws-sdk/client-dynamodb";
import { EventBridgeEvent } from 'aws-lambda';
// import { v4 as uuidv4 } from 'uuid';

import { Expense } from '../types/expenses';
import { DynamoPayment } from '../types/payments';

const dynamoClient = new DynamoDB({});

export async function handler(event: EventBridgeEvent<'expense:created', Expense>): Promise<void> {
  const expenseCreated = event.detail;
  const payments: DynamoPayment[] = [];

  // calculate price for each installment
  const calculatedPrice = expenseCreated.price / expenseCreated.installments;

  // create base payment with common fields
  const basePayment = {
    bank: { S: expenseCreated.bank },
    card_issuer: { S: expenseCreated.card_issuer },
    currency: { S: expenseCreated.currency },
    expense_id: { S: expenseCreated.id },
    price: { N: calculatedPrice.toFixed(2) },
    payment_method: { S: expenseCreated.payment_method },
  };

  // generate first payment date
  const initialDate = new Date(expenseCreated.first_impact_date);

  // create payments collection, one for each installment
  for (let i = 0; i < expenseCreated.installments; i++) {
    // clone initial date
    const currentDate = new Date(initialDate.valueOf())

    // add i months to cloned initial date
    currentDate.setMonth(initialDate.getMonth() + i);

    // create payment with basePayment and installment details
    const currentInstallment = i + 1;
    payments.push({
      ...basePayment,
      // id: { S: uuidv4() }, // this id is not needed, search indexes should be: impact_date and expense_id 
      impact_date: { S: currentDate.toISOString() },
      installment_number: { N: currentInstallment.toString() },
    });
  }

  // store payments
  try {
    const batchWriteCommand = new BatchWriteItemCommand({
      RequestItems: {
        [process.env.PAYMENTS_TABLE_NAME!]: payments.map(payment => ({
          PutRequest: {
            Item: payment,
          }
        })),
      }
    });
    await dynamoClient.send(batchWriteCommand);
  } catch (error) {
    console.error('Failed to create payments', error);
  }
}
