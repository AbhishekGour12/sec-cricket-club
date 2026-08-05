import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../../config/database';
import { User } from '../../user/models/User';

export interface NotificationAttributes {
  id: number;
  type: 'new_registration' | 'approval_request';
  title: string;
  message: string;
  read: boolean;
  user_id: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface NotificationCreationAttributes extends Omit<NotificationAttributes, 'id' | 'read' | 'created_at' | 'updated_at'> {
  read?: boolean;
}

export class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
  public declare id: number;
  public declare type: 'new_registration' | 'approval_request';
  public declare title: string;
  public declare message: string;
  public declare read: boolean;
  public declare user_id: number;

  public declare readonly created_at: Date;
  public declare readonly updated_at: Date;
}

Notification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM('new_registration', 'approval_request'),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  },
  {
    sequelize,
    tableName: 'notifications',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

// Define associations
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });

export default Notification;
