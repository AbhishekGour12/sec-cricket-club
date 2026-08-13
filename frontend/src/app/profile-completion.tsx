import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { z } from 'zod';
import { Colors, Typography, Spacing, Radius } from '@/theme';
import { ThemeIcon } from '../theme/icons';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../store/authStore';
import { useProfileStore } from '../store/profileStore';
import { Input } from '../components/Input';
import { api } from '../services/api';
import BusinessCardUpload from '../components/BusinessCardUpload';
import {
  calculateProfileCompletion,
  mergeProfileCompletionFields,
} from '../utils/profileCompletion';
import { getMediaUrl } from '../utils/mediaUrl';
import { StatusBar } from 'expo-status-bar';

const DESIGNATIONS = [
  'Associate Member',
  'Life Member',
  'Managing Director',
  'Executive Member',
  'President',
  'Secretary',
  'Treasurer',
];

const INDUSTRIES = [
  'Manufacturing & Production',
  'Technology & IT',
  'Retail & Commerce',
  'Services & Consulting',
  'Healthcare & Medicine',
  'Real Estate & Construction',
  'Finance & Banking',
  'Education & Training',
  'Food & Hospitality',
  'Agriculture',
  'Others',
];

// Zod step validation schemas
const step1Schema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  designation: z.string().min(1, 'Please select your designation'),
});

const step2Schema = z.object({
  membership_number: z.string().min(2, 'Membership number must be at least 2 characters'),
  phone: z.string().regex(/^\+?[0-9]{10,14}$/, 'Phone number must be a valid 10-14 digit number'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  state: z.string().min(2, 'State must be at least 2 characters'),
  country: z.string().min(2, 'Country must be at least 2 characters'),
});

const step3Schema = z.object({
  business_name: z.string().min(2, 'Business name must be at least 2 characters'),
  business_category: z.string().min(1, 'Please select your business category'),
  business_description: z.string().min(10, 'Business description must be at least 10 characters'),
  website: z.string().refine((val) => {
    if (!val) return true;
    return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(val);
  }, 'Please enter a valid website link').optional().or(z.literal('')),
  business_address: z.string().min(5, 'Business address must be at least 5 characters'),
});

const step4Schema = z.object({
  visiting_card: z.string().min(1, 'At least one side of the visiting card is required'),
});

export default function ProfileCompletionScreen() {
  const router = useRouter();
  const { user, refetchUser, logout } = useAuth();
  const storeUpdateUser = useAuthStore((state) => state.updateUser);
  const { step, formData, updateFormData, nextStep, prevStep, reset } = useProfileStore();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState<string | null>(null); // tracks active field upload
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selector modals
  const [designationModal, setDesignationModal] = useState(false);
  const [categoryModal, setCategoryModal] = useState(false);

  // Visiting card split local states
  const [cardFront, setCardFront] = useState('');
  const [cardBack, setCardBack] = useState('');

  // Sync user attributes upon entry
  useEffect(() => {
    if (user) {
      updateFormData({
        full_name: formData.full_name || user.full_name || '',
        profile_image: formData.profile_image || user.profile_image || '',
        membership_number: formData.membership_number || user.membership_number || '',
        phone: formData.phone || user.phone || '',
        designation: formData.designation || user.designation || 'Associate Member',
        city: formData.city || user.city || '',
        state: formData.state || user.state || '',
        country: formData.country || user.country || '',
        business_name: formData.business_name || user.business_name || '',
        business_category: formData.business_category || user.business_category || '',
        business_description: formData.business_description || user.business_description || '',
        website: formData.website || user.website || '',
        business_logo: formData.business_logo || user.business_logo || '',
        visiting_card: formData.visiting_card || user.visiting_card || '',
        business_images:
          formData.business_images.length > 0
            ? formData.business_images
            : user.business_images || [],
      });

      const savedCards = (user.visiting_card || '')
        .split(',')
        .map((card) => card.trim())
        .filter(Boolean);
      setCardFront((current) => current || savedCards[0] || '');
      setCardBack((current) => current || savedCards[1] || '');

      // Dynamically determine the initial step based on filled fields
      const hasStep1 = !!user.full_name && !!user.designation;
      const hasStep2 = hasStep1 && !!user.membership_number && !!user.phone && !!user.city && !!user.state && !!user.country;
      const hasStep3 = hasStep2 && !!user.business_name && !!user.business_category;
      
      let initialStep = 0;
      if (hasStep3) initialStep = 3;
      else if (hasStep2) initialStep = 2;
      else if (hasStep1) initialStep = 1;
      
      // Set the step to the highest validated step on first load
      if (step === 0) {
        useProfileStore.getState().setStep(initialStep);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Request media library and camera access permissions
  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      alert('Camera and Gallery access permissions are required to upload pictures.');
      return false;
    }
    return true;
  };

  // Upload file helper
  const handleUploadImage = async (
    localUri: string,
    type: 'profile-image' | 'business-logo' | 'visiting-card-front' | 'visiting-card-back' | 'business-images',
    useCamera = false
  ) => {
    setIsUploading(type);
    try {
      const formDataUpload = new FormData();
      const filename = localUri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const fileType = match ? `image/${match[1]}` : `image/jpeg`;

      formDataUpload.append(type === 'business-images' ? 'images' : 'image', {
        uri: localUri,
        name: filename,
        type: fileType,
      } as any);

      // Pass useCamera flag to the backend
      formDataUpload.append('is_live_capture', useCamera ? 'true' : 'false');

      const isVisitingCard = type === 'visiting-card-front' || type === 'visiting-card-back';
      const endpoint = type === 'business-images'
        ? '/upload/business-images'
        : isVisitingCard
          ? '/upload/visiting-card'
          : `/upload/${type}`;

      const response = await api.post(endpoint, formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (err: any) {
      console.error(`Upload error for ${type}:`, err);
      if (err.response?.data?.validationErrors && Array.isArray(err.response.data.validationErrors)) {
        const errorMsg = err.response.data.validationErrors.join('\n\n');
        alert(`Visiting Card Image Rejected:\n\n${errorMsg}`);
      } else {
        alert(err.response?.data?.message || 'Failed to upload image. Please try again.');
      }
      return null;
    } finally {
      setIsUploading(null);
    }
  };

  const pickImage = async (
    type: 'profile-image' | 'business-logo' | 'visiting-card-front' | 'visiting-card-back' | 'business-images',
    useCamera = false
  ) => {
    const permitted = await requestPermissions();
    if (!permitted) return;

    let result;
    const pickerOptions: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.6,
    };

    if (type === 'profile-image' || type === 'business-logo') {
      pickerOptions.aspect = [1, 1];
    } else {
      pickerOptions.aspect = [4, 3];
    }

    if (useCamera) {
      result = await ImagePicker.launchCameraAsync(pickerOptions);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
    }

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const pickedUri = result.assets[0].uri;

      if (type === 'profile-image') {
        const uploadRes = await handleUploadImage(pickedUri, 'profile-image');
        if (uploadRes && uploadRes.url) {
          updateFormData({ profile_image: uploadRes.url });
        }
      } else if (type === 'business-logo') {
        const uploadRes = await handleUploadImage(pickedUri, 'business-logo');
        if (uploadRes && uploadRes.url) {
          updateFormData({ business_logo: uploadRes.url });
        }
      } else if (type === 'visiting-card-front') {
        const uploadRes = await handleUploadImage(pickedUri, 'visiting-card-front', useCamera);
        if (uploadRes && uploadRes.url) {
          setCardFront(uploadRes.url);
          const completeCard = cardBack ? `${uploadRes.url},${cardBack}` : uploadRes.url;
          updateFormData({ visiting_card: completeCard });
        }
      } else if (type === 'visiting-card-back') {
        const uploadRes = await handleUploadImage(pickedUri, 'visiting-card-back', useCamera);
        if (uploadRes && uploadRes.url) {
          setCardBack(uploadRes.url);
          const completeCard = cardFront ? `${cardFront},${uploadRes.url}` : uploadRes.url;
          updateFormData({ visiting_card: completeCard });
        }
      } else if (type === 'business-images') {
        if (formData.business_images.length >= 5) {
          alert('Maximum 5 showcase images are allowed.');
          return;
        }
        const uploadRes = await handleUploadImage(pickedUri, 'business-images');
        if (uploadRes && uploadRes.urls && uploadRes.urls.length > 0) {
          updateFormData({
            business_images: [...formData.business_images, uploadRes.urls[0]],
          });
        }
      }
    }
  };

  const removeBusinessImage = (indexToRemove: number) => {
    updateFormData({
      business_images: formData.business_images.filter((_, idx) => idx !== indexToRemove),
    });
  };

  const getImageUrl = (imagePath?: string) => getMediaUrl(imagePath) ?? null;

  const validateStep = () => {
    setErrors({});
    try {
      if (step === 0) {
        step1Schema.parse(formData);
      } else if (step === 1) {
        step2Schema.parse(formData);
      } else if (step === 2) {
        step3Schema.parse(formData);
      } else if (step === 3) {
        step4Schema.parse(formData);
      }
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.issues.forEach((e) => {
          if (e.path[0]) {
            newErrors[e.path[0].toString()] = e.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      nextStep();
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)/home');
  };

  const handleLogout = async () => {
    try {
      await logout();
      reset();
      router.replace('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleFinish = async () => {
    if (!validateStep()) return;

    setIsSubmitting(true);
    try {
      // Put complete payload to backend
      const response = await api.put('/me', {
        ...formData,
        is_profile_completed: true,
        status: 'pending', // Awaiting Admin verification check
      });

      // Update Zustand user profile state
      storeUpdateUser(response.data.user);
      
      // Clear TanStack query cache for currentUser
      await refetchUser();

      alert('Registration Completed! Your profile is pending administrator verification.');
      reset();
      router.replace('/(tabs)/home');
    } catch (err: any) {
      console.error('Submit profile error:', err);
      alert(err.response?.data?.message || 'Failed to complete registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <ThemeIcon name="profile" size={22} color={Colors.primary} />
              <Text style={styles.cardTitle}>Personal Details</Text>
            </View>

            {/* Profile Image Picker */}
            <View style={styles.avatarContainer}>
              <Pressable style={styles.avatarPressable} onPress={() => pickImage('profile-image')}>
                {formData.profile_image ? (
                  <Image source={{ uri: getImageUrl(formData.profile_image) || undefined }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <ThemeIcon name="profile" size={54} color={Colors.text.outline} />
                  </View>
                )}
                <View style={styles.cameraIconBadge}>
                  <ThemeIcon name="sports" size={16} color="#FFFFFF" />
                </View>
              </Pressable>
              {isUploading === 'profile-image' ? (
                <ActivityIndicator size="small" color={Colors.secondary} style={styles.uploadLoader} />
              ) : (
                <Text style={styles.tapPhotoText}>TAP TO UPDATE PHOTO</Text>
              )}
            </View>

            {/* Inputs */}
            <Input
              label="Full Name"
              placeholder="e.g. Arthur Richardson"
              value={formData.full_name}
              onChangeText={(val) => updateFormData({ full_name: val })}
              error={errors.full_name}
            />

            <View style={styles.dropdownContainer}>
              <Text style={styles.dropdownLabel}>Designation / Role</Text>
              <Pressable style={styles.dropdownButton} onPress={() => setDesignationModal(true)}>
                <Text style={styles.dropdownButtonText}>{formData.designation}</Text>
                <ThemeIcon name="chevronRight" size={20} color={Colors.text.secondary} />
              </Pressable>
              {errors.designation && <Text style={styles.errorTextInline}>{errors.designation}</Text>}
            </View>

            <View style={styles.welcomeBox}>
              <Text style={styles.welcomeQuote}>
                &quot;Welcome to the SEC Cricket Club, {formData.full_name || 'Member'}! Completing your profile helps us tailor your match alerts and club updates.&quot;
              </Text>
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <ThemeIcon name="settings" size={22} color={Colors.primary} />
              <Text style={styles.cardTitle}>Club Credentials & Contact</Text>
            </View>

            <Input
              label="Membership Number"
              placeholder="e.g. SEC-8271"
              value={formData.membership_number}
              onChangeText={(val) => updateFormData({ membership_number: val })}
              error={errors.membership_number}
              autoCapitalize="characters"
            />

            <Input
              label="Phone Number"
              placeholder="e.g. 9876543210"
              value={formData.phone}
              onChangeText={(val) => updateFormData({ phone: val })}
              error={errors.phone}
              keyboardType="phone-pad"
            />

            <Input
              label="City"
              placeholder="e.g. Ludhiana"
              value={formData.city}
              onChangeText={(val) => updateFormData({ city: val })}
              error={errors.city}
            />

            <Input
              label="State"
              placeholder="e.g. Punjab"
              value={formData.state}
              onChangeText={(val) => updateFormData({ state: val })}
              error={errors.state}
            />

            <Input
              label="Country"
              placeholder="e.g. India"
              value={formData.country}
              onChangeText={(val) => updateFormData({ country: val })}
              error={errors.country}
            />
          </View>
        );

      case 2:
        return (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <ThemeIcon name="lock" size={22} color={Colors.primary} />
              <Text style={styles.cardTitle}>Professional Profile</Text>
            </View>

            <Input
              label="Business Name"
              placeholder="e.g. Sterling Ventures"
              value={formData.business_name}
              onChangeText={(val) => updateFormData({ business_name: val })}
              error={errors.business_name}
            />

            <View style={styles.dropdownContainer}>
              <Text style={styles.dropdownLabel}>Industry Category</Text>
              <Pressable style={styles.dropdownButton} onPress={() => setCategoryModal(true)}>
                <Text style={styles.dropdownButtonText}>
                  {formData.business_category || 'Select category...'}
                </Text>
                <ThemeIcon name="chevronRight" size={20} color={Colors.text.secondary} />
              </Pressable>
              {errors.business_category && <Text style={styles.errorTextInline}>{errors.business_category}</Text>}
            </View>

            <Input
              label="Website"
              placeholder="e.g. www.sterlingventures.com"
              value={formData.website}
              onChangeText={(val) => updateFormData({ website: val })}
              error={errors.website}
              keyboardType="url"
              autoCapitalize="none"
            />

            <Input
              label="Business Address"
              placeholder="e.g. Vance Industrial Area, Ludhiana"
              value={formData.business_address}
              onChangeText={(val) => updateFormData({ business_address: val })}
              error={errors.business_address}
            />

            <Input
              label="Business Description"
              placeholder="Summarize your business services & offerings..."
              value={formData.business_description}
              onChangeText={(val) => updateFormData({ business_description: val })}
              error={errors.business_description}
              multiline
              numberOfLines={4}
              inputStyle={styles.textareaStyle}
            />
          </View>
        );

      case 3:
        return (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <ThemeIcon name="check" size={22} color={Colors.primary} />
              <Text style={styles.cardTitle}>Branding & Verification Assets</Text>
            </View>

            {/* Business Logo Section */}
            <View style={styles.mediaUploadSection}>
              <Text style={styles.mediaTitle}>Business Logo</Text>
              <Pressable style={styles.logoPickerBox} onPress={() => pickImage('business-logo')}>
                {formData.business_logo ? (
                  <Image source={{ uri: getImageUrl(formData.business_logo) || undefined }} style={styles.logoImagePreview} />
                ) : (
                  <View style={styles.placeholderBox}>
                    <ThemeIcon name="sports" size={32} color={Colors.text.outline} />
                    <Text style={styles.placeholderBoxText}>Tap to pick logo</Text>
                  </View>
                )}
              </Pressable>
              {isUploading === 'business-logo' && <ActivityIndicator size="small" color={Colors.secondary} />}
            </View>

            {/* Visiting Card Front/Back — with guidelines modal */}
            <BusinessCardUpload
              cardFront={cardFront ? (getImageUrl(cardFront) ?? '') : ''}
              cardBack={cardBack ? (getImageUrl(cardBack) ?? '') : ''}
              onUpload={() => {}}
              onPickImage={async (side, useCamera) => {
                await pickImage(
                  side === 'front' ? 'visiting-card-front' : 'visiting-card-back',
                  useCamera
                );
              }}
              isUploading={
                isUploading === 'visiting-card-front'
                  ? 'front'
                  : isUploading === 'visiting-card-back'
                  ? 'back'
                  : null
              }
              error={errors.visiting_card}
            />

            {/* Business Showcase Images List */}
            <View style={styles.mediaUploadSection}>
              <View style={styles.showcaseImagesHeader}>
                <Text style={styles.mediaTitle}>Showcase Images (Max 5)</Text>
                <Text style={styles.imagesCounter}>{formData.business_images.length}/5</Text>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imagesScroll}>
                {formData.business_images.map((item, idx) => (
                  <View key={idx} style={styles.thumbnailWrapper}>
                    <Image source={{ uri: getImageUrl(item) || undefined }} style={styles.showcaseThumbnail} />
                    <Pressable style={styles.removeThumbnailBadge} onPress={() => removeBusinessImage(idx)}>
                      <ThemeIcon name="close" size={14} color="#FFFFFF" />
                    </Pressable>
                  </View>
                ))}
                {formData.business_images.length < 5 && (
                  <Pressable style={styles.addShowcaseBox} onPress={() => pickImage('business-images')}>
                    <ThemeIcon name="sports" size={24} color={Colors.text.outline} />
                    <Text style={styles.addShowcaseText}>Add Photo</Text>
                  </Pressable>
                )}
              </ScrollView>
              {isUploading === 'business-images' && <ActivityIndicator size="small" color={Colors.secondary} style={styles.loaderMargin} />}
            </View>

            <View style={styles.networkShieldBox}>
              <ThemeIcon name="info" size={18} color={Colors.secondary} style={styles.shieldIcon} />
              <View style={styles.shieldTexts}>
                <Text style={styles.shieldHeading}>Club Member Network</Text>
                <Text style={styles.shieldBody}>
                  Your professional details are only shared within the verified member directory to foster networking opportunities within the SEC community.
                </Text>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const effectiveProfile = mergeProfileCompletionFields(user, formData);
  const completionPercent = calculateProfileCompletion(effectiveProfile);
  const progressLabel = step >= 2 ? 'BUSINESS DETAILS' : 'PROFILE STRENGTH';

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Light screen — dark status bar icons for iOS readability */}
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        {/* Custom Header Row */}
        <View style={styles.header}>
          <Pressable 
            style={styles.headerBackBtn} 
            onPress={() => {
              if (step > 0) prevStep();
              else handleSkip();
            }}
          >
            <ThemeIcon name="arrowBack" size={24} color={Colors.text.primary} />
          </Pressable>
          <Text style={styles.headerTitleText}>
            {step >= 2 ? 'Business Details' : 'Complete Your Profile'}
          </Text>
          <Pressable style={styles.headerLogoutBtn} onPress={handleLogout}>
            <ThemeIcon name="logout" size={22} color={Colors.secondary} />
          </Pressable>
        </View>

        {/* Progress Bar Header */}
        <View style={styles.progressBarWrapper}>
          <View style={styles.progressBarLabelRow}>
            <Text style={styles.progressLabel}>{progressLabel}</Text>
            <Text style={styles.progressPercent}>{completionPercent}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${completionPercent}%` as `${number}%` },
              ]}
            />
          </View>
        </View>

        {/* Form Body Scroll */}
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderStepContent()}
        </ScrollView>

        {/* Footer Navigation Buttons */}
        <View style={styles.footer}>
          {step === 3 ? (
            <View style={styles.footerFinishRow}>
              <Pressable style={styles.btnSecondary} onPress={prevStep}>
                <Text style={styles.btnSecondaryText}>PREVIOUS</Text>
              </Pressable>
              <Pressable 
                style={[styles.btnPrimary, isSubmitting && styles.btnDisabled]} 
                onPress={handleFinish}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.btnPrimaryText}>COMPLETE REGISTRATION</Text>
                )}
              </Pressable>
            </View>
          ) : (
            <View style={styles.footerNextBlock}>
              <Pressable style={styles.btnPrimaryFull} onPress={handleNext}>
                <Text style={styles.btnPrimaryFullText}>NEXT</Text>
                <ThemeIcon name="chevronRight" size={18} color="#FFFFFF" style={styles.nextChevron} />
              </Pressable>
            </View>
          )}

          <Pressable style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipBtnText}>Skip for now</Text>
          </Pressable>
        </View>

        {/* Options Modals */}
        <OptionsModal
          visible={designationModal}
          options={DESIGNATIONS}
          title="Select Designation / Role"
          onSelect={(opt) => updateFormData({ designation: opt })}
          onClose={() => setDesignationModal(false)}
        />

        <OptionsModal
          visible={categoryModal}
          options={INDUSTRIES}
          title="Select Industry Category"
          onSelect={(opt) => updateFormData({ business_category: opt })}
          onClose={() => setCategoryModal(false)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Selector Modal ───────────────────────────────────────────────────────────

// Reusable Options Dropdown Modal
const OptionsModal = ({
  visible,
  options,
  title,
  onSelect,
  onClose,
}: {
  visible: boolean;
  options: string[];
  title: string;
  onSelect: (option: string) => void;
  onClose: () => void;
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalDismiss} onPress={onClose} />
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Pressable onPress={onClose} style={styles.modalCloseBtn}>
              <ThemeIcon name="close" size={20} color={Colors.text.primary} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            {options.map((opt, idx) => (
              <Pressable
                key={idx}
                style={styles.modalOption}
                onPress={() => {
                  onSelect(opt);
                  onClose();
                }}
              >
                <Text style={styles.modalOptionText}>{opt}</Text>
                <ThemeIcon name="chevronRight" size={16} color={Colors.text.outline} />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0F2F7',
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(122, 133, 160, 0.1)',
  },
  headerBackBtn: {
    padding: 8,
  },
  headerLogoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.round,
    backgroundColor: '#FFF0F2',
    borderWidth: 1,
    borderColor: 'rgba(196, 18, 48, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleText: {
    ...Typography.subHeading,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  progressBarWrapper: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(122, 133, 160, 0.08)',
  },
  progressBarLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  progressLabel: {
    ...Typography.caption,
    fontWeight: '800',
    letterSpacing: 1,
    color: Colors.text.secondary,
  },
  progressPercent: {
    ...Typography.caption,
    fontWeight: '900',
    color: Colors.primary,
    fontSize: 13,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(122, 133, 160, 0.15)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(122, 133, 160, 0.1)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(122, 133, 160, 0.1)',
    paddingBottom: Spacing.sm,
  },
  cardTitle: {
    ...Typography.subHeading,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    marginLeft: Spacing.sm,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatarPressable: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F2F7',
    borderWidth: 2,
    borderColor: 'rgba(122, 133, 160, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: Colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapPhotoText: {
    ...Typography.caption,
    color: Colors.text.outline,
    fontWeight: '700',
    marginTop: Spacing.sm,
    letterSpacing: 1,
  },
  uploadLoader: {
    marginTop: Spacing.sm,
  },
  dropdownContainer: {
    marginVertical: Spacing.sm,
  },
  dropdownLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    height: 52,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(122, 133, 160, 0.3)',
  },
  dropdownButtonText: {
    ...Typography.body,
    color: Colors.text.primary,
  },
  welcomeBox: {
    backgroundColor: 'rgba(196, 18, 48, 0.03)',
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary,
    padding: Spacing.md,
    borderRadius: Radius.sm,
    marginTop: Spacing.xl,
  },
  welcomeQuote: {
    ...Typography.body,
    fontSize: 13,
    fontStyle: 'italic',
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  textareaStyle: {
    height: 90,
    textAlignVertical: 'top',
    paddingTop: Spacing.sm,
  },
  mediaUploadSection: {
    marginVertical: Spacing.md,
  },
  mediaTitle: {
    ...Typography.caption,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  logoPickerBox: {
    height: 120,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(122, 133, 160, 0.5)',
    backgroundColor: 'rgba(122, 133, 160, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  placeholderBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderBoxText: {
    ...Typography.caption,
    color: Colors.text.outline,
    marginTop: Spacing.xs,
    fontWeight: '600',
  },
  visitingCardsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  visitingCardBlock: {
    flex: 1,
  },
  visitingCardSubLabel: {
    ...Typography.caption,
    color: Colors.text.outline,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  visitingCardBox: {
    height: 90,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(122, 133, 160, 0.4)',
    backgroundColor: 'rgba(122, 133, 160, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  attachedCardBorder: {
    borderStyle: 'solid',
    borderColor: Colors.primary,
  },
  visitingCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardPlaceholder: {
    alignItems: 'center',
  },
  cardPlaceholderText: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.text.outline,
    marginTop: 4,
    fontWeight: '600',
  },
  showcaseImagesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  imagesCounter: {
    ...Typography.caption,
    color: Colors.text.outline,
    fontWeight: '700',
  },
  imagesScroll: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  thumbnailWrapper: {
    position: 'relative',
    width: 72,
    height: 72,
  },
  showcaseThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(122, 133, 160, 0.2)',
  },
  removeThumbnailBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.secondary,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  addShowcaseBox: {
    width: 72,
    height: 72,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(122, 133, 160, 0.5)',
    backgroundColor: 'rgba(122, 133, 160, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addShowcaseText: {
    ...Typography.caption,
    fontSize: 9,
    color: Colors.text.outline,
    marginTop: 2,
    fontWeight: '700',
  },
  loaderMargin: {
    marginVertical: Spacing.sm,
  },
  networkShieldBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(122, 133, 160, 0.04)',
    borderLeftWidth: 3,
    borderLeftColor: Colors.text.outline,
    padding: Spacing.md,
    borderRadius: Radius.sm,
    marginTop: Spacing.lg,
  },
  shieldIcon: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  shieldTexts: {
    flex: 1,
  },
  shieldHeading: {
    ...Typography.body,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  shieldBody: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.text.secondary,
    lineHeight: 15,
    marginTop: 2,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(122, 133, 160, 0.1)',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  footerNextBlock: {
    alignItems: 'center',
  },
  btnPrimaryFull: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  btnPrimaryFullText: {
    ...Typography.button,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  nextChevron: {
    marginLeft: 6,
  },
  skipBtn: {
    paddingVertical: Spacing.md,
    alignSelf: 'center',
  },
  skipBtnText: {
    ...Typography.button,
    color: Colors.text.secondary,
    fontSize: 14,
    fontWeight: '700',
  },
  footerFinishRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  btnSecondary: {
    flex: 1,
    height: 52,
    borderWidth: 1.5,
    borderColor: 'rgba(122, 133, 160, 0.3)',
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F2F7',
  },
  btnSecondaryText: {
    ...Typography.button,
    color: Colors.text.secondary,
    fontWeight: '800',
  },
  btnPrimary: {
    flex: 2,
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    ...Typography.button,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  errorTextInline: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalDismiss: {
    flex: 1,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '60%',
    paddingBottom: Spacing.huge,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(122, 133, 160, 0.1)',
  },
  modalTitle: {
    ...Typography.subHeading,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScroll: {
    paddingHorizontal: Spacing.lg,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(122, 133, 160, 0.08)',
  },
  modalOptionText: {
    ...Typography.body,
    color: Colors.text.primary,
    fontSize: 15,
  },
});
