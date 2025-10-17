import { Module } from '@nestjs/common';
import * as admin from 'firebase-admin';

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  throw new Error('FIREBASE_CONFIG env var is missing');
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  credential: admin.credential.cert(serviceAccount),
});

@Module({})
export class FirebaseModule {}
