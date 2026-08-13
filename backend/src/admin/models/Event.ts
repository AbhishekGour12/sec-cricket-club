import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export const EVENT_TYPES = [
  'League Match',
  'Tournament',
  'Friendly',
  'Club Gala',
  'Annual Event',
  'Other',
] as const;

export const EVENT_STATUSES = [
  'Draft',
  'Published',
  'Cancelled',
  'Completed',
  'Expired',
] as const;

export type EventType = (typeof EVENT_TYPES)[number];
export type EventStatus = (typeof EVENT_STATUSES)[number];

export interface EventAttributes {
  id: number;
  event_name: string;
  event_type: EventType;
  event_date: Date;
  start_time: string;
  venue_name: string;
  venue_address?: string | null;
  map_link?: string | null;
  teams_involved?: string | null;
  description?: string | null;
  event_image?: string | null;
  is_featured: boolean;
  status: EventStatus;
  created_by?: number | null;
  updated_by?: number | null;
  created_at?: Date;
  updated_at?: Date;
}

export type EventCreationAttributes = Optional<
  EventAttributes,
  | 'id'
  | 'venue_address'
  | 'map_link'
  | 'teams_involved'
  | 'description'
  | 'event_image'
  | 'is_featured'
  | 'status'
  | 'created_by'
  | 'updated_by'
  | 'created_at'
  | 'updated_at'
>;

export class Event
  extends Model<EventAttributes, EventCreationAttributes>
  implements EventAttributes
{
  public declare id: number;
  public declare event_name: string;
  public declare event_type: EventType;
  public declare event_date: Date;
  public declare start_time: string;
  public declare venue_name: string;
  public declare venue_address?: string | null;
  public declare map_link?: string | null;
  public declare teams_involved?: string | null;
  public declare description?: string | null;
  public declare event_image?: string | null;
  public declare is_featured: boolean;
  public declare status: EventStatus;
  public declare created_by?: number | null;
  public declare updated_by?: number | null;
  public declare readonly created_at: Date;
  public declare readonly updated_at: Date;
}

Event.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    event_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    event_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'Other',
    },
    event_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    start_time: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    venue_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    venue_address: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    map_link: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    teams_involved: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    event_image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'Draft',
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
    tableName: 'events',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['status'] },
      { fields: ['event_type'] },
      { fields: ['event_date'] },
      { fields: ['is_featured'] },
    ],
  },
);

export default Event;
