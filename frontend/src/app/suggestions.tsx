import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors, Spacing, Radius, Shadows, Typography } from '@/theme';
import {
  useMySuggestions,
  useSubmitSuggestion,
  SuggestionType,
  SuggestionStatus,
} from '@/hooks/useSuggestions';
import { useToast } from '@/components/Toast';

const CATEGORIES: { type: SuggestionType; label: string; icon: keyof typeof MaterialIcons.glyphMap; color: string; bg: string }[] = [
  { type: 'Suggestion', label: 'Suggestion', icon: 'lightbulb-outline', color: '#D97706', bg: '#FEF3C7' },
  { type: 'Complaint', label: 'Complaint', icon: 'report-problem', color: '#E11D48', bg: '#FFE4E6' },
  { type: 'Feedback', label: 'Feedback', icon: 'thumb-up-alt', color: '#0284C7', bg: '#E0F2FE' },
  { type: 'General', label: 'General Query', icon: 'chat', color: '#059669', bg: '#D1FAE5' },
];

export default function SuggestionsScreen() {
  const router = useRouter();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');
  const [selectedType, setSelectedType] = useState<SuggestionType>('Suggestion');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { suggestions, isLoading: historyLoading, refetch } = useMySuggestions(activeTab === 'history');
  const submitMutation = useSubmitSuggestion();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      toast.showError('Required Field', 'Please write your message or suggestion before submitting.');
      return;
    }

    if (trimmedMessage.length < 4) {
      toast.showError('Too Short', 'Please enter at least 4 characters so we can understand your feedback.');
      return;
    }

    try {
      await submitMutation.mutateAsync({
        type: selectedType,
        subject: subject.trim() || undefined,
        message: trimmedMessage,
      });

      toast.showSuccess(
        'Submitted Successfully',
        'Thank you! Your feedback has been forwarded to club administrators.'
      );
      setMessage('');
      setSubject('');
      setActiveTab('history');
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message || 'Failed to submit your suggestion. Please try again.';
      toast.showError('Submission Failed', errMsg);
    }
  };

  const getStatusBadge = (status: SuggestionStatus) => {
    switch (status) {
      case 'Resolved':
        return { label: 'Resolved', bg: '#DCFCE7', text: '#15803D', icon: 'check-circle' as const };
      case 'Reviewed':
        return { label: 'Reviewed', bg: '#E0E7FF', text: '#4338CA', icon: 'visibility' as const };
      case 'Archived':
        return { label: 'Archived', bg: '#F1F5F9', text: '#64748B', icon: 'inventory-2' as const };
      case 'Pending':
      default:
        return { label: 'Pending Review', bg: '#FEF3C7', text: '#B45309', icon: 'hourglass-empty' as const };
    }
  };

  const getTypeBadge = (type: SuggestionType) => {
    const found = CATEGORIES.find((c) => c.type === type);
    return found || { label: type, color: Colors.primary, bg: '#F1F5F9', icon: 'chat' as const };
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Top Navigation Header */}
      <View style={styles.topBar}>
        <Pressable
          style={styles.backBtn}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/home' as any);
            }
          }}
          hitSlop={8}
          accessibilityLabel="Go back or Home"
        >
          <MaterialIcons
            name={router.canGoBack() ? 'arrow-back' : 'home'}
            size={24}
            color="#FFFFFF"
          />
        </Pressable>

        <View style={styles.topBarTitleCol}>
          <Text style={styles.topBarTitle}>Suggestions & Complaints</Text>
          <Text style={styles.topBarSubtitle}>Help us improve SEC Cricket Club</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      {/* Segmented Tab Switcher */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tabButton, activeTab === 'submit' && styles.tabButtonActive]}
          onPress={() => setActiveTab('submit')}
        >
          <MaterialIcons
            name="edit-note"
            size={18}
            color={activeTab === 'submit' ? Colors.primary : '#64748B'}
          />
          <Text
            style={[styles.tabButtonText, activeTab === 'submit' && styles.tabButtonTextActive]}
          >
            Submit Feedback
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
          onPress={() => setActiveTab('history')}
        >
          <MaterialIcons
            name="history"
            size={18}
            color={activeTab === 'history' ? Colors.primary : '#64748B'}
          />
          <Text
            style={[styles.tabButtonText, activeTab === 'history' && styles.tabButtonTextActive]}
          >
            My Submissions
          </Text>
          {suggestions.length > 0 && (
            <View style={styles.historyCountBadge}>
              <Text style={styles.historyCountBadgeText}>{suggestions.length}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {activeTab === 'submit' ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Intro Notice Card */}
            <View style={styles.noticeCard}>
              <View style={styles.noticeIconCircle}>
                <MaterialIcons name="security" size={20} color={Colors.primary} />
              </View>
              <View style={styles.noticeTextCol}>
                <Text style={styles.noticeTitle}>Direct & Confidential</Text>
                <Text style={styles.noticeDesc}>
                  Your feedback is sent directly to the club committee. You will be notified when an admin reviews or responds.
                </Text>
              </View>
            </View>

            {/* Category Selector */}
            <Text style={styles.sectionLabel}>Select Category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const isSelected = selectedType === cat.type;
                return (
                  <Pressable
                    key={cat.type}
                    style={[
                      styles.categoryCard,
                      isSelected && {
                        borderColor: cat.color,
                        backgroundColor: cat.bg,
                        ...Shadows.sm,
                      },
                    ]}
                    onPress={() => setSelectedType(cat.type)}
                  >
                    <View
                      style={[
                        styles.categoryIconCircle,
                        { backgroundColor: isSelected ? '#FFFFFF' : cat.bg },
                      ]}
                    >
                      <MaterialIcons name={cat.icon} size={20} color={cat.color} />
                    </View>
                    <Text
                      style={[
                        styles.categoryLabel,
                        isSelected && { color: cat.color, fontWeight: '800' },
                      ]}
                    >
                      {cat.label}
                    </Text>
                    {isSelected && (
                      <View style={[styles.categoryCheckDot, { backgroundColor: cat.color }]}>
                        <MaterialIcons name="check" size={12} color="#FFFFFF" />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Subject Input (Optional) */}
            <Text style={styles.sectionLabel}>Subject (Optional)</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.subjectInput}
                placeholder="e.g., Ground practice nets, tournament scheduling..."
                placeholderTextColor="#94A3B8"
                value={subject}
                onChangeText={setSubject}
                maxLength={100}
              />
            </View>

            {/* Message Input Box */}
            <View style={styles.labelRow}>
              <Text style={styles.sectionLabel}>Your Message / Suggestion *</Text>
              <Text style={styles.charCountText}>{message.length}/1000</Text>
            </View>
            <View style={styles.textAreaWrap}>
              <TextInput
                style={styles.textAreaInput}
                placeholder="Please describe your suggestion, concern, or idea in detail..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                value={message}
                onChangeText={setMessage}
                maxLength={1000}
              />
            </View>

            {/* Submit Button */}
            <Pressable
              style={({ pressed }) => [
                styles.submitBtn,
                submitMutation.isPending && styles.submitBtnDisabled,
                pressed && styles.submitBtnPressed,
              ]}
              onPress={handleSubmit}
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? (
                <ActivityIndicator color="#b41616ff" size="small" />
              ) : (
                <>

                  <Text style={styles.submitBtnText}>Submit to Committee</Text>
                </>
              )}
            </Pressable>
          </ScrollView>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[Colors.primary]}
                tintColor={Colors.primary}
              />
            }
          >
            {historyLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={Colors.primary} size="large" />
                <Text style={styles.loadingText}>Loading your submissions...</Text>
              </View>
            ) : suggestions.length === 0 ? (
              <View style={styles.emptyBox}>
                <View style={styles.emptyIconCircle}>
                  <MaterialIcons name="inbox" size={36} color="#94A3B8" />
                </View>
                <Text style={styles.emptyTitle}>No Submissions Yet</Text>
                <Text style={styles.emptyDesc}>
                  Have any suggestion, complaint, or feedback? Use the "Submit Feedback" tab to share it with the club committee.
                </Text>
                <Pressable
                  style={styles.emptyActionBtn}
                  onPress={() => setActiveTab('submit')}
                >
                  <Text style={styles.emptyActionBtnText}>Write a Suggestion</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.historyList}>
                {suggestions.map((item) => {
                  const statusInfo = getStatusBadge(item.status);
                  const typeInfo = getTypeBadge(item.type);
                  const formattedDate = new Date(item.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  });

                  return (
                    <View key={item.id} style={styles.historyCard}>
                      {/* History Card Top Row */}
                      <View style={styles.historyCardHeader}>
                        <View
                          style={[
                            styles.typePill,
                            { backgroundColor: typeInfo.bg, borderColor: typeInfo.color + '40' },
                          ]}
                        >
                          <MaterialIcons name={typeInfo.icon} size={12} color={typeInfo.color} />
                          <Text style={[styles.typePillText, { color: typeInfo.color }]}>
                            {item.type}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.statusPill,
                            { backgroundColor: statusInfo.bg },
                          ]}
                        >
                          <MaterialIcons name={statusInfo.icon} size={12} color={statusInfo.text} />
                          <Text style={[styles.statusPillText, { color: statusInfo.text }]}>
                            {statusInfo.label}
                          </Text>
                        </View>
                      </View>

                      {/* Subject */}
                      {item.subject ? (
                        <Text style={styles.historySubject}>{item.subject}</Text>
                      ) : null}

                      {/* Message Content */}
                      <Text style={styles.historyMessage}>{item.message}</Text>

                      {/* Admin Response Section (if reviewed/resolved) */}
                      {item.admin_notes ? (
                        <View style={styles.adminNoteBox}>
                          <View style={styles.adminNoteHeader}>
                            <MaterialIcons name="forum" size={14} color={Colors.primary} />
                            <Text style={styles.adminNoteTitle}>Admin Response:</Text>
                          </View>
                          <Text style={styles.adminNoteText}>{item.admin_notes}</Text>
                        </View>
                      ) : null}

                      {/* Card Footer Date */}
                      <View style={styles.historyFooter}>
                        <MaterialIcons name="schedule" size={12} color="#94A3B8" />
                        <Text style={styles.historyDateText}>Submitted on {formattedDate}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitleCol: {
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  topBarSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: '#F1F5F9',
  },
  tabButtonActive: {
    backgroundColor: '#E2E8F0',
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  tabButtonTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  historyCountBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.round,
  },
  historyCountBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 150,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  noticeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  noticeTextCol: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  noticeDesc: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
  },
  sectionLabel: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 8,
    letterSpacing: -0.1,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  charCountText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Spacing.lg,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  categoryIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    flexShrink: 1,
  },
  categoryCheckDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 6,
  },
  subjectInput: {
    fontSize: 13,
    color: '#0F172A',
  },
  textAreaWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.xl,
    padding: Spacing.md,
    minHeight: 130,
  },
  textAreaInput: {
    fontSize: 13,
    color: '#0F172A',
    minHeight: 110,
    lineHeight: 19,
  },
  submitBtn: {
    backgroundColor: '#D90429',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: '#B91C1C',
    ...Shadows.md,
    marginTop: 6,
    color: "#B91C1C"

  },
  submitBtnPressed: {
    backgroundColor: '#B91C1C',
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  submitBtnDisabled: {
    opacity: 0.55,
    backgroundColor: '#94A3B8',
    borderColor: '#94A3B8',
  },
  submitBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
    backgroundColor: '#a21212ff',
    padding: 10,
    borderRadius: Radius.md,
    textAlign: 'center'
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  emptyActionBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  historyList: {
    gap: 12,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.round,
    borderWidth: 1,
  },
  typePillText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.round,
  },
  statusPillText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  historySubject: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  historyMessage: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 10,
  },
  adminNoteBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    marginBottom: 8,
  },
  adminNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  adminNoteTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  adminNoteText: {
    fontSize: 11.5,
    color: '#334155',
    lineHeight: 16,
  },
  historyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  historyDateText: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '600',
  },
});
