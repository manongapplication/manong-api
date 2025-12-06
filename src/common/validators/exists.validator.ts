/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { PrismaService } from 'src/prisma/prisma.service';

// Store the PrismaService instance globally
let prismaService: PrismaService;

export function setPrismaService(prisma: PrismaService) {
  prismaService = prisma;
  // console.log('PrismaService initialized for validation:', !!prisma);
}

export function Exists(
  model: string,
  column: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'exists',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [model, column],
      async: true,
      validator: {
        async validate(
          value: any,
          args: ValidationArguments,
        ): Promise<boolean> {
          // console.log(`Validating ${args.property} with value:`, value);

          if (value == null) return true;

          if (!prismaService) {
            console.error(
              'PrismaService not initialized. Make sure setPrismaService() is called.',
            );
            return false;
          }

          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const [model, column] = args.constraints;
          // console.log(
          //   `Checking model '${model}' for column '${column}' with value '${value}'`,
          // );

          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const prismaModel = (prismaService as any)[model];

          if (!prismaModel || typeof prismaModel.findUnique !== 'function') {
            console.error(
              `Model ${model} does not exist or doesn't have findUnique method`,
            );
            return false;
          }

          try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
            const record = await prismaModel.findUnique({
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              where: { [column]: value },
            });
            console.log(
              // `Record found for ${model}.${column} = ${value}:`,
              !!record,
            );
            return !!record;
          } catch (error) {
            console.error(
              `Error validating existence for model ${model}:`,
              error,
            );
            return false;
          }
        },

        defaultMessage(args: ValidationArguments): string {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const [model] = args.constraints;
          return `${args.property} must reference an existing ${model}`;
        },
      },
    });
  };
}
