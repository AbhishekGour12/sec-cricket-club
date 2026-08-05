export interface ProfileCompletionFields {
  full_name?: string;
  designation?: string;
  profile_image?: string;
  membership_number?: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  business_name?: string;
  business_category?: string;
  business_description?: string;
  visiting_card?: string;
  business_logo?: string;
  business_images?: string[];
}

interface CompletionField {
  key: keyof ProfileCompletionFields;
  weight: number;
  nextAction: string;
}

/**
 * Single source of truth for profile completion throughout the app.
 * Keep the weights at a total of 100.
 */
const COMPLETION_FIELDS: CompletionField[] = [
  { key: 'full_name', weight: 10, nextAction: 'Enter your full name' },
  { key: 'designation', weight: 5, nextAction: 'Select your designation' },
  { key: 'profile_image', weight: 15, nextAction: 'Add your profile photo' },
  { key: 'membership_number', weight: 5, nextAction: 'Add your membership number' },
  { key: 'phone', weight: 5, nextAction: 'Add your phone number' },
  { key: 'city', weight: 5, nextAction: 'Add your city' },
  { key: 'state', weight: 5, nextAction: 'Add your state' },
  { key: 'country', weight: 5, nextAction: 'Add your country' },
  { key: 'business_name', weight: 10, nextAction: 'Add your business details' },
  { key: 'business_category', weight: 5, nextAction: 'Select your business category' },
  { key: 'business_description', weight: 5, nextAction: 'Add your business description' },
  { key: 'visiting_card', weight: 15, nextAction: 'Upload your membership card image' },
  { key: 'business_logo', weight: 5, nextAction: 'Upload your business logo' },
  { key: 'business_images', weight: 5, nextAction: 'Add a business image' },
];

const hasValue = (value: ProfileCompletionFields[keyof ProfileCompletionFields]) =>
  Array.isArray(value)
    ? value.some((item) => item.trim().length > 0)
    : typeof value === 'string' && value.trim().length > 0;

export const calculateProfileCompletion = (
  profile?: ProfileCompletionFields | null,
): number => {
  if (!profile) return 0;

  return COMPLETION_FIELDS.reduce(
    (total, field) => total + (hasValue(profile[field.key]) ? field.weight : 0),
    0,
  );
};

export const mergeProfileCompletionFields = (
  saved?: ProfileCompletionFields | null,
  draft?: ProfileCompletionFields | null,
): ProfileCompletionFields => {
  const merged: ProfileCompletionFields = { ...saved };
  if (!draft) return merged;

  COMPLETION_FIELDS.forEach(({ key }) => {
    const draftValue = draft[key];
    if (hasValue(draftValue)) {
      (merged as Record<string, unknown>)[key] = draftValue;
    }
  });

  return merged;
};

export const getNextProfileAction = (
  profile?: ProfileCompletionFields | null,
): string => {
  if (!profile) return 'Complete your profile';

  return (
    COMPLETION_FIELDS.find((field) => !hasValue(profile[field.key]))?.nextAction ??
    'Profile complete'
  );
};
