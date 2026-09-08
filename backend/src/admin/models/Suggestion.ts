import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export const SUGGESTION_TYPES = [
  'Suggestion',
  'Complaint',
  'Feedback',
  'General',
] as const;

export type SuggestionType = (typeof SUGGESTION_TYPES)[number];

export const SUGGESTION_STATUSES = [
  'Pending',
  'Reviewed',
  'Resolved',
  'Archived',
] as const;

export type SuggestionStatus = (typeof SUGGESTION_STATUSES)[number];

export interface SuggestionAttributes {
  id: number;
  user_id?: number | null;
  type: SuggestionType;
  subject?: string | null;
  message: string;
  status: SuggestionStatus;
  admin_notes?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export type SuggestionCreationAttributes = Optional<
  SuggestionAttributes,
  'id' | 'user_id' | 'subject' | 'status' | 'admin_notes' | 'created_at' | 'updated_at'
>;

export class Suggestion
  extends Model<SuggestionAttributes, SuggestionCreationAttributes>
  implements SuggestionAttributes
{
  public declare id: number;
  public declare user_id?: number | null;
  public declare type: SuggestionType;
  public declare subject?: string | null;
  public declare message: string;
  public declare status: SuggestionStatus;
  public declare admin_notes?: string | null;
  public declare readonly created_at: Date;
  public declare readonly updated_at: Date;
}

Suggestion.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'Suggestion',
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'Pending',
    },
    admin_notes: {
      type: DataTypes.TEXT,
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
    tableName: 'suggestions',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['status'] },
      { fields: ['type'] },
      { fields: ['created_at'] },
    ],
  },
);

export default Suggestion;
