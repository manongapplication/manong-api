export interface AttachmentType {
  id: number;
  type: string;
  url: string;
  messageId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatType {
  id: number;
  senderId: number;
  receiverId: number;
  roomId: string;
  content: string;
  attachments: {
    id: number;
    type: string;
    url: string;
  }[];
  createdAt: Date;
}
