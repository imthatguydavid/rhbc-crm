import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

/**
 * DynamoDB client configuration
 * Uses environment variables for AWS credentials and region
 */
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-west-2',
});

/**
 * Document client for easier DynamoDB operations
 * Automatically marshals/unmarshals JavaScript objects
 */
export const dynamoDb = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true, // Remove undefined values
    convertEmptyValues: false,   // Don't convert empty strings to null
  },
});

/**
 * Table names from environment variables
 */
export const Tables = {
  FAMILIES: process.env.FAMILIES_TABLE || 'rhbc-families',
  PEOPLE: process.env.PEOPLE_TABLE || 'rhbc-people',
  CHECKINS: process.env.CHECKINS_TABLE || 'rhbc-checkins',
  EVENTS: process.env.EVENTS_TABLE || 'rhbc-events',
  EVENT_REGISTRATIONS: process.env.EVENT_REGISTRATIONS_TABLE || 'rhbc-event-registrations',
};