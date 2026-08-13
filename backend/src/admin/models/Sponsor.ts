import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export interface SponsorAttributes {
  id: number;
  name: string;
  logo?: string | null;
  website?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export type SponsorCreationAttributes = Optional<
  SponsorAttributes,
  'id' | 'logo' | 'website' | 'created_at' | 'updated_at'
>;

export class Sponsor
  extends Model<SponsorAttributes, SponsorCreationAttributes>
  implements SponsorAttributes
{
  public declare id: number;
  public declare name: string;
  public declare logo?: string | null;
  public declare website?: string | null;
  public declare readonly created_at: Date;
  public declare readonly updated_at: Date;
}

Sponsor.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    logo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING(1000),
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
    tableName: 'sponsors',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [{ fields: ['name'] }],
  },
);

export default Sponsor;
