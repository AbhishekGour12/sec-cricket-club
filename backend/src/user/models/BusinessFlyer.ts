import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export interface BusinessFlyerAttributes {
  id: number;
  user_id: number;
  image_url: string;
  display_order: number;
  created_at?: Date;
  updated_at?: Date;
}

export type BusinessFlyerCreationAttributes = Optional<
  BusinessFlyerAttributes,
  'id' | 'display_order' | 'created_at' | 'updated_at'
>;

export class BusinessFlyer
  extends Model<BusinessFlyerAttributes, BusinessFlyerCreationAttributes>
  implements BusinessFlyerAttributes
{
  public declare id: number;
  public declare user_id: number;
  public declare image_url: string;
  public declare display_order: number;
  public declare readonly created_at: Date;
  public declare readonly updated_at: Date;
}

BusinessFlyer.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
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
    image_url: {
      type: DataTypes.STRING,
      allowNull: false,
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
    tableName: 'business_flyers',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['user_id', 'display_order'] },
    ],
  },
);

export default BusinessFlyer;
