import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { UploadedDocument } from './uploaded-document.entity';
import type { MarketingFunnelResult } from '../types/marketing-funnel-result';

@Entity('funnel_generations')
export class FunnelGeneration {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'user_id' })
  @Index()
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column('uuid', { name: 'upload_id' })
  @Index()
  uploadId!: string;

  @ManyToOne(() => UploadedDocument, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'upload_id' })
  upload!: UploadedDocument;

  @Column({ type: 'jsonb' })
  result!: MarketingFunnelResult;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
