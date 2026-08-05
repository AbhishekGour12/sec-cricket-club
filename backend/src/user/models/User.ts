import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../../config/database';

/** A single club accomplishment or award shown on the member profile. */
export interface Achievement {
  id: string;
  title: string;
  year?: string;
}

/** Fields a member can individually hide from the member directory. */
export type PrivacyField =
  | 'phone'
  | 'alternate_phone'
  | 'contact_email'
  | 'instagram_url'
  | 'facebook_url'
  | 'linkedin_url'
  | 'website';

export type PrivacyVisibility = 'all' | 'hidden';

export type PrivacySettings = Partial<Record<PrivacyField, PrivacyVisibility>>;

export const PRIVACY_FIELDS: PrivacyField[] = [
  'phone',
  'alternate_phone',
  'contact_email',
  'instagram_url',
  'facebook_url',
  'linkedin_url',
  'website',
];

export interface UserAttributes {
  id: number;
  firebase_uid: string;
  email?: string | null;
  full_name?: string;
  profile_image?: string;
  phone?: string;
  alternate_phone?: string;
  contact_email?: string;
  instagram_url?: string;
  facebook_url?: string;
  linkedin_url?: string;
  achievements?: Achievement[];
  privacy_settings?: PrivacySettings;
  bookmarked_members?: number[];
  membership_number?: string;
  designation?: string;
  business_name?: string;
  business_category?: string;
  business_description?: string;
  business_address?: string;
  business_logo?: string;
  visiting_card?: string;
  visiting_card_status: 'pending' | 'approved' | 'rejected';
  visiting_card_rejection_reason?: string;
  visiting_card_is_live_capture?: boolean;
  business_images?: string[]; // Stored as JSON array of file paths/URLs
  city?: string;
  state?: string;
  country?: string;
  website?: string;
  is_profile_completed: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  status: 'active' | 'inactive';
  approved_by?: number | null;
  approved_at?: Date | null;
  rejected_by?: number | null;
  rejected_at?: Date | null;
  rejection_reason?: string | null;
  fcm_token?: string | null;
  role: 'member' | 'admin' | 'moderator';
  member_source?: 'self_registration' | 'manual' | 'excel';
  created_at?: Date;
  updated_at?: Date;
}

export interface UserCreationAttributes extends Omit<UserAttributes, 'id' | 'is_profile_completed' | 'status' | 'role' | 'visiting_card_status' | 'created_at' | 'updated_at' | 'approval_status'> {
  is_profile_completed?: boolean;
  status?: 'active' | 'inactive';
  approval_status?: 'pending' | 'approved' | 'rejected';
  role?: 'member' | 'admin' | 'moderator';
  visiting_card_status?: 'pending' | 'approved' | 'rejected';
  visiting_card_is_live_capture?: boolean;
  member_source?: 'self_registration' | 'manual' | 'excel';
}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public declare id: number;
  public declare firebase_uid: string;
  public declare email?: string | null;
  public declare full_name?: string;
  public declare profile_image?: string;
  public declare phone?: string;
  public declare alternate_phone?: string;
  public declare contact_email?: string;
  public declare instagram_url?: string;
  public declare facebook_url?: string;
  public declare linkedin_url?: string;
  public declare achievements?: Achievement[];
  public declare privacy_settings?: PrivacySettings;
  public declare bookmarked_members?: number[];
  public declare membership_number?: string;
  public declare business_name?: string;
  public declare business_category?: string;
  public declare designation?: string;
  public declare business_description?: string;
  public declare business_address?: string;
  public declare business_logo?: string;
  public declare visiting_card?: string;
  public declare visiting_card_status: 'pending' | 'approved' | 'rejected';
  public declare visiting_card_rejection_reason?: string;
  public declare visiting_card_is_live_capture?: boolean;
  public declare business_images?: string[];
  public declare city?: string;
  public declare state?: string;
  public declare country?: string;
  public declare website?: string;
  public declare is_profile_completed: boolean;
  public declare approval_status: 'pending' | 'approved' | 'rejected';
  public declare status: 'active' | 'inactive';
  public declare approved_by?: number | null;
  public declare approved_at?: Date | null;
  public declare rejected_by?: number | null;
  public declare rejected_at?: Date | null;
  public declare rejection_reason?: string | null;
  public declare fcm_token?: string | null;
  public declare role: 'member' | 'admin' | 'moderator';
  public declare member_source?: 'self_registration' | 'manual' | 'excel';


  // Timestamps
  public declare readonly created_at: Date;
  public declare readonly updated_at: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    firebase_uid: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      // Nullable because bulk-imported rosters are keyed on mobile number;
      // the email is filled in when the member first signs in with Google.
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        isEmailOrNull(value: string | null) {
          if (value === null || value === undefined || value === '') return;
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            throw new Error('Validation isEmail on email failed');
          }
        },
      },
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    profile_image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    alternate_phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    contact_email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    instagram_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    facebook_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    linkedin_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    achievements: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    privacy_settings: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
    bookmarked_members: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    membership_number: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    business_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    business_category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    designation: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    business_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    business_address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    business_logo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    visiting_card: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    visiting_card_status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'approved',
    },
    visiting_card_rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    visiting_card_is_live_capture: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    business_images: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_profile_completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    approval_status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'pending',
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'inactive',
    },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejected_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rejected_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    fcm_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('member', 'admin', 'moderator'),
      allowNull: false,
      defaultValue: 'member',
    },
    member_source: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'self_registration',
    },
  },
  {
    sequelize,
    tableName: 'users',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['firebase_uid'],
      },
      {
        unique: true,
        fields: ['email'],
      },
    ],
  }
);

export default User;
