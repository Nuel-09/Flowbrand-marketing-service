import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export type UploadDocumentStatus =
  | 'uploading'
  | 'processing'
  | 'ready'
  | 'failed';

export type UploadDocumentFileType = 'pdf' | 'docx';

@Entity('uploaded_documents')
export class UploadedDocument {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'user_id' })
  @Index()
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'original_filename' })
  originalFilename!: string;

  @Column({ name: 'file_type', type: 'varchar', length: 8 })
  fileType!: UploadDocumentFileType;

  @Column({ name: 'file_size_bytes', type: 'int' })
  fileSizeBytes!: number;

  @Column({ type: 'varchar', length: 20 })
  status!: UploadDocumentStatus;

  @Column({ type: 'int', default: 0 })
  percent!: number;

  @Column({ name: 'storage_path', type: 'text', nullable: true })
  storagePath!: string | null;

  @Column({ name: 'extracted_text', type: 'text', nullable: true })
  extractedText!: string | null;

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason!: string | null;

  @CreateDateColumn({ name: 'uploaded_at', type: 'timestamptz' })
  uploadedAt!: Date;
}
