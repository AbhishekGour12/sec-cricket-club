import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export const SPONSOR_TIERS = [
  'Title Sponsor',
  'Co-Sponsor',
  'Associate Sponsor',
] as const;

export type SponsorTier = (typeof SPONSOR_TIERS)[number];

export const SPONSOR_TIER_PRIORITY: Record<SponsorTier, number> = {
  'Title Sponsor': 1,
  'Co-Sponsor': 2,
  'Associate Sponsor': 3,
};

export interface EventSponsorAttributes {
  id: number;
  event_id: number;
  sponsor_id: number;
  tier: SponsorTier;
  display_order: number;
  created_at?: Date;
  updated_at?: Date;
}

export type EventSponsorCreationAttributes = Optional<
  EventSponsorAttributes,
  'id' | 'display_order' | 'created_at' | 'updated_at'
>;

export class EventSponsor
  extends Model<EventSponsorAttributes, EventSponsorCreationAttributes>
  implements EventSponsorAttributes
{
  public declare id: number;
  public declare event_id: number;
  public declare sponsor_id: number;
  public declare tier: SponsorTier;
  public declare display_order: number;
  public declare readonly created_at: Date;
  public declare readonly updated_at: Date;
}

EventSponsor.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    event_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sponsor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tier: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'Associate Sponsor',
    },
    display_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
    tableName: 'event_sponsors',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['event_id'] },
      { fields: ['sponsor_id'] },
      { unique: true, fields: ['event_id', 'sponsor_id'] },
    ],
  },
);

export default EventSponsor;
