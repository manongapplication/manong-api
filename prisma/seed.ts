import { AdminSeeder } from './seeders/admin.seeder';
import { AppMaintenanceSeeder } from './seeders/app-maintenance.seeder';
import { PaymentMethodSeeder } from './seeders/payment-method.seeder';
import { ServiceItemSeeder } from './seeders/service-item.seeder';
import { ServiceSettingsSeeder } from './seeders/service-settings.seeder';
import { SubServiceItemSeeder } from './seeders/sub-service-item.seeder';
import { UrgencyLevelSeeder } from './seeders/urgency-level.seeder';
import { UserSeeder } from './seeders/user.seeder';

async function main() {
  await new ServiceItemSeeder().run();
  await new ServiceSettingsSeeder().run();
  await new SubServiceItemSeeder().run();
  await new UrgencyLevelSeeder().run();
  await new PaymentMethodSeeder().run();
  await new UserSeeder().run();
  await new AdminSeeder().run();
  await new AppMaintenanceSeeder().run();
}

main()
  .then(() => {
    console.log('Seeding completed');
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
