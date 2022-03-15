import { AttributeValue } from "@aws-sdk/client-dynamodb";

import { Currency, PaymentMethod } from "./common";

export type DynamoExpense = {
  id: AttributeValue.SMember;
  username: AttributeValue.SMember;
  category: AttributeValue.SMember;
  description: AttributeValue.SMember;
  place: AttributeValue.SMember;
  currency: { S: Currency };
  creation_date: AttributeValue.SMember;
  payment_method: { S: PaymentMethod };
  first_impact_date: AttributeValue.SMember;
  installments: AttributeValue.NMember;
  bank: AttributeValue.SMember;
  card_issuer: AttributeValue.SMember;
  price: AttributeValue.NMember;
};

export type Expense = {
  id: string;
  username: string;
  category: string;
  description: string;
  place: string;
  currency: Currency;
  creation_date: string;
  payment_method: PaymentMethod;
  first_impact_date: string;
  installments: number;
  bank: string;
  card_issuer: string;
  price: number;
};

export type StoreExpenseHandlerProps = Omit<Expense, 'id'>;