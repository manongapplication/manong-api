export class CreateImageUploadDto {
  images: Express.Multer.File[];
  serviceRequestId: number;
  messageId: number;
}
