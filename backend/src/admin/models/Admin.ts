import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../../config/database';

export interface AdminAttributes {
  id: number;
  email: string;
  password?: string;
  full_name?: string;
  profile_image?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface AdminCreationAttributes extends Omit<AdminAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class Admin extends Model<AdminAttributes, AdminCreationAttributes> implements AdminAttributes {
  public declare id: number;
  public declare email: string;
  public declare password?: string;
  public declare full_name?: string;
  public declare profile_image?: string;

  // Timestamps
  public declare readonly created_at: Date;
  public declare readonly updated_at: Date;
}

Admin.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    profile_image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'admins',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['email'],
      },
    ],
  }
);

export default Admin;
