import { Module } from '@nestjs/common';
import * as admin from 'firebase-admin';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);

admin.initializeApp({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  credential: admin.credential.cert(serviceAccount),
});

@Module({})
export class FirebaseModule {}
