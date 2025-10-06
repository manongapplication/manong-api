export interface AttachmentType {
  id: number;
  type: string;
  url: string;
  message_id: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatType {
  id: number;
  roomId: string;
  senderId: string;
  content: string;
  attachments: {
    id: number;
    type: string;
    url: string;
  }[];
  createdAt: Date;
}
