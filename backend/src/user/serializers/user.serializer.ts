import User, {
  Achievement,
  PRIVACY_FIELDS,
  PrivacyField,
  PrivacySettings,
} from '../models/User';

/**
 * Everything a member is allowed to see about their own account.
 */
export const serializeSelf = (user: User) => ({
  id: user.id,
  firebase_uid: user.firebase_uid,
  email: user.email,
  full_name: user.full_name,
  profile_image: user.profile_image,
  phone: user.phone,
  alternate_phone: user.alternate_phone,
  contact_email: user.contact_email,
  instagram_url: user.instagram_url,
  facebook_url: user.facebook_url,
  linkedin_url: user.linkedin_url,
  achievements: normalizeAchievements(user.achievements),
  privacy_settings: normalizePrivacy(user.privacy_settings),
  bookmarked_members: normalizeBookmarks(user.bookmarked_members),
  membership_number: user.membership_number,
  designation: user.designation,
  business_name: user.business_name,
  business_category: user.business_category,
  business_description: user.business_description,
  business_address: user.business_address,
  business_logo: user.business_logo,
  visiting_card: user.visiting_card,
  visiting_card_status: user.visiting_card_status,
  visiting_card_rejection_reason: user.visiting_card_rejection_reason,
  business_images: user.business_images,
  city: user.city,
  state: user.state,
  country: user.country,
  website: user.website,
  is_profile_completed: user.is_profile_completed,
  status: user.status,
  approval_status: user.approval_status,
  rejection_reason: user.rejection_reason,
  role: user.role,
  member_source: user.member_source,
  created_at: user.created_at,
});

/**
 * A member as seen by another member. Only directory-safe fields are returned.
 */
export const serializePublic = (user: User, viewerId?: number) => {
  if (viewerId && viewerId === user.id) return serializeSelf(user);

  const privacy = normalizePrivacy(user.privacy_settings);
  const visible: Record<string, unknown> = {
    id: user.id,
    full_name: user.full_name,
    profile_image: user.profile_image,
    membership_number: user.membership_number,
    designation: user.designation,
    business_name: user.business_name,
    business_category: user.business_category,
    business_description: user.business_description,
    business_address: user.business_address,
    business_logo: user.business_logo,
    visiting_card: user.visiting_card,
    business_images: user.business_images,
    city: user.city,
    state: user.state,
    country: user.country,
    achievements: normalizeAchievements(user.achievements),
    phone: user.phone,
    alternate_phone: user.alternate_phone,
    contact_email: user.contact_email,
    instagram_url: user.instagram_url,
    facebook_url: user.facebook_url,
    linkedin_url: user.linkedin_url,
    website: user.website,
  };

  PRIVACY_FIELDS.forEach((field) => {
    if (privacy[field] === 'hidden') {
      visible[field] = null;
    }
  });

  return visible;
};

export const normalizeAchievements = (value: unknown): Achievement[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index): Achievement | null => {
      if (!item || typeof item !== 'object') return null;
      const entry = item as Record<string, unknown>;
      const title = typeof entry.title === 'string' ? entry.title.trim() : '';
      if (!title) return null;

      const year = typeof entry.year === 'string' ? entry.year.trim().slice(0, 12) : '';

      return {
        id: typeof entry.id === 'string' && entry.id ? entry.id : `ach_${Date.now()}_${index}`,
        title: title.slice(0, 200),
        ...(year ? { year } : {}),
      };
    })
    .filter((item): item is Achievement => item !== null)
    .slice(0, 25);
};

export const normalizePrivacy = (value: unknown): PrivacySettings => {
  const source = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const result: PrivacySettings = {};

  PRIVACY_FIELDS.forEach((field: PrivacyField) => {
    result[field] = source[field] === 'hidden' ? 'hidden' : 'all';
  });

  return result;
};

export const normalizeBookmarks = (value: unknown): number[] => {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  );
};
