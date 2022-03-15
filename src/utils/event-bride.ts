import { EventBridgeClient, PutEventsCommand, PutEventsCommandOutput, PutEventsRequestEntry } from "@aws-sdk/client-eventbridge";

const client = new EventBridgeClient({});

const createEvents = async (eventBusName: string, eventName: string, items: any[]): Promise<void> => {
  if (!items.length) {
    return;
  }

  const entries: PutEventsRequestEntry[] = items.map(item => ({
    EventBusName: eventBusName,
    Source: `knut:events`,
    DetailType: eventName,
    Detail: JSON.stringify(item),
  }));

  const putEventCommand = new PutEventsCommand({ Entries: entries });

  const result = await client.send(putEventCommand);
  console.log(result);
};

export {
  createEvents,
}