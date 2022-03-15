import { AttributeValue } from "@aws-sdk/client-dynamodb";

import { Currency, PaymentMethod } from "./common";

export type DynamoPayment = {
  // id: AttributeValue.SMember;
  impact_date: AttributeValue.SMember;
  bank: AttributeValue.SMember;
  card_issuer: AttributeValue.SMember;
  installment_number: AttributeValue.NMember;
  price: AttributeValue.NMember;
  payment_method: {
    S: PaymentMethod;
  };
  currency: {
    S: Currency;
  };
  expense_id: AttributeValue.SMember;
};
