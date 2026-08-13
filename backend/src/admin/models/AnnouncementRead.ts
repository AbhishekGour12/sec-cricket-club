import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export interface AnnouncementReadAttributes {
  id: number;
  announcement_id: number;
  user_id: number;
  read_at: Date;
  created_at?: Date;
  updated_at?: Date;
}

export type AnnouncementReadCreationAttributes = Optional<
  AnnouncementReadAttributes,
  'id' | 'read_at' | 'created_at' | 'updated_at'
>;

export class AnnouncementRead
  extends Model<AnnouncementReadAttributes, AnnouncementReadCreationAttributes>
  implements AnnouncementReadAttributes
{
  public declare id: number;
  public declare announcement_id: number;
  public declare user_id: number;
  public declare read_at: Date;
  public declare readonly created_at: Date;
  public declare readonly updated_at: Date;
}

AnnouncementRead.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    announcement_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'announcements', key: 'id' },
      onDelete: 'CASCADE',
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
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
    tableName: 'announcement_reads',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { unique: true, fields: ['announcement_id', 'user_id'] },
      { fields: ['user_id'] },
    ],
  },
);

export default AnnouncementRead;
