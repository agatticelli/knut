import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

import { badRequest, ok } from "../utils/responses";

const ddbClient = new DynamoDBClient({});

const dateValidator = (date: string) => /^\d{4}\/\d{2}\/\d{2}$/.test(date);

// create a lambda handler to process dynamodb stream
const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { from, to } = event.queryStringParameters || {};
  if (!from || !to || !dateValidator(from) || !dateValidator(to)) {
    return badRequest('Invalid date format. Use: YYYY/MM/DD');
  }

  const [fYear, fMonth, fDay] = from.split('/');
  const [tYear, tMonth, tDay] = to.split('/');

  const fromDate = new Date(Number(fYear), Number(fMonth) - 1, Number(fDay), 0, 0, 0, 0);
  const toDate = new Date(Number(tYear), Number(tMonth) - 1, Number(tDay), 23, 59, 59, 999);

  const scanParams = {
    FilterExpression: "impact_date BETWEEN :from and :to",
    ExpressionAttributeValues: {
      ":from": { S: fromDate.toISOString() },
      ":to": { S: toDate.toISOString() },
    },
    ProjectionExpression: 'price',
    TableName: process.env.PAYMENTS_TABLE_NAME,
  };

  const data = await ddbClient.send(new ScanCommand(scanParams));
  const sum = data.Items?.reduce((acc, cur) => acc + Number(cur.price.N), 0) || 0;

  return ok({
    total_amount: sum,
  });
};

export { handler };
