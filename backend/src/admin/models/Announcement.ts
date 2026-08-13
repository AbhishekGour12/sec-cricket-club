import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export const ANNOUNCEMENT_TYPES = [
  'General',
  'Meeting',
  'Event',
  'Emergency',
  'Holiday',
  'Club Update',
  'Tournament',
  'Business Update',
] as const;

export const ANNOUNCEMENT_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'] as const;
export const ANNOUNCEMENT_STATUSES = ['Draft', 'Published', 'Expired'] as const;

export type AnnouncementType = (typeof ANNOUNCEMENT_TYPES)[number];
export type AnnouncementPriority = (typeof ANNOUNCEMENT_PRIORITIES)[number];
export type AnnouncementStatus = (typeof ANNOUNCEMENT_STATUSES)[number];

export interface AnnouncementAttributes {
  id: number;
  title: string;
  short_description: string;
  description: string;
  cover_image?: string | null;
  attachments?: string[] | null;
  announcement_type: AnnouncementType;
  priority: AnnouncementPriority;
  is_pinned: boolean;
  status: AnnouncementStatus;
  publish_date?: Date | null;
  expiry_date?: Date | null;
  created_by?: number | null;
  updated_by?: number | null;
  created_at?: Date;
  updated_at?: Date;
}

export type AnnouncementCreationAttributes = Optional<
  AnnouncementAttributes,
  | 'id'
  | 'cover_image'
  | 'attachments'
  | 'is_pinned'
  | 'status'
  | 'publish_date'
  | 'expiry_date'
  | 'created_by'
  | 'updated_by'
  | 'created_at'
  | 'updated_at'
>;

export class Announcement
  extends Model<AnnouncementAttributes, AnnouncementCreationAttributes>
  implements AnnouncementAttributes
{
  public declare id: number;
  public declare title: string;
  public declare short_description: string;
  public declare description: string;
  public declare cover_image?: string | null;
  public declare attachments?: string[] | null;
  public declare announcement_type: AnnouncementType;
  public declare priority: AnnouncementPriority;
  public declare is_pinned: boolean;
  public declare status: AnnouncementStatus;
  public declare publish_date?: Date | null;
  public declare expiry_date?: Date | null;
  public declare created_by?: number | null;
  public declare updated_by?: number | null;
  public declare readonly created_at: Date;
  public declare readonly updated_at: Date;
}

Announcement.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    short_description: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    cover_image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    attachments: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    announcement_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'General',
    },
    priority: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'Medium',
    },
    is_pinned: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'Draft',
    },
    publish_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expiry_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'announcements',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['status'] },
      { fields: ['announcement_type'] },
      { fields: ['is_pinned'] },
      { fields: ['publish_date'] },
    ],
  },
);

export default Announcement;
