import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows, ThemeIcon } from '@/theme';
import { useToast } from '@/components/Toast';
import {
  useSubmitSuggestion,
  useMySuggestions,
  SuggestionType,
  SuggestionItem,
} from '@/hooks/useSuggestions';

const TYPES: { key: SuggestionType; label: string; icon: string; activeColor: string }[] = [
  { key: 'Suggestion', label: 'Suggestion', icon: 'star', activeColor: '#0284C7' },
  { key: 'Complaint', label: 'Complaint', icon: 'warning', activeColor: '#C41230' },
  { key: 'Feedback', label: 'Feedback', icon: 'notification', activeColor: '#059669' },
];

export function SuggestionBoxCard() {
  const toast = useToast();
  const [selectedType, setSelectedType] = useState<SuggestionType>('Suggestion');
  const [message, setMessage] = useState('');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const submitMutation = useSubmitSuggestion();
  const { suggestions: myHistory, isLoading: historyLoading } = useMySuggestions(
    isHistoryModalOpen
  );

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      toast.showError('Required', 'Please enter your suggestion or complaint before submitting.');
      return;
    }

    try {
      await submitMutation.mutateAsync({
        type: selectedType,
        message: trimmed,
      });

      toast.showSuccess(
        'Submission Received',
        'Thank you! Your feedback has been sent directly to the club management.'
      );
      setMessage('');
    } catch (err: any) {
      toast.showError(
        'Submission Failed',
        err.response?.data?.message || 'Could not send feedback. Please try again.'
      );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Resolved':
        return { label: 'Resolved', bg: '#DCFCE7', text: '#15803D' };
      case 'Reviewed':
        return { label: 'Reviewed', bg: '#E0F2FE', text: '#0369A1' };
      case 'Archived':
        return { label: 'Archived', bg: '#F1F5F9', text: '#64748B' };
      case 'Pending':
      default:
        return { label: 'Pending Review', bg: '#FEF3C7', text: '#B45309' };
    }
  };

  return (
    <View style={styles.cardContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconBg}>
          <ThemeIcon name="star" size={20} color="#C41230" />
        </View>
        <View style={styles.headerTextCol}>
          <Text style={styles.title}>Member Suggestion Box</Text>
          <Text style={styles.subtitle}>
            Have an idea, feedback, or a grievance? Let the club committee know.
          </Text>
        </View>
      </View>

      {/* Category Pills */}
      <View style={styles.typeSelectorRow}>
        {TYPES.map((t) => {
          const isSelected = selectedType === t.key;
          return (
            <Pressable
              key={t.key}
              style={[
                styles.typePill,
                isSelected && {
                  backgroundColor: `${t.activeColor}15`,
                  borderColor: t.activeColor,
                },
              ]}
              onPress={() => setSelectedType(t.key)}
            >
              <Text
                style={[
                  styles.typePillText,
                  isSelected && { color: t.activeColor, fontWeight: '700' },
                ]}
              >
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Text Area Input */}
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.textInput}
          multiline
          numberOfLines={4}
          value={message}
          onChangeText={setMessage}
          maxLength={1000}
          placeholder={`Write your ${selectedType.toLowerCase()} here...`}
          placeholderTextColor="#94A3B8"
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{message.length}/1000</Text>
      </View>

      {/* Action Row */}
      <View style={styles.actionRow}>
        <Pressable
          style={styles.historyBtn}
          onPress={() => setIsHistoryModalOpen(true)}
        >
          <ThemeIcon name="event" size={14} color={Colors.text.secondary} />
          <Text style={styles.historyBtnText}>My Submissions</Text>
        </Pressable>

        <Pressable
          style={[
            styles.submitBtn,
            (!message.trim() || submitMutation.isPending) && styles.submitBtnDisabled,
          ]}
          disabled={!message.trim() || submitMutation.isPending}
          onPress={handleSubmit}
        >
          {submitMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.submitBtnText}>SUBMIT</Text>
              <ThemeIcon name="chevronRight" size={15} color="#FFFFFF" />
            </>
          )}
        </Pressable>
      </View>

      {/* My Past Submissions Modal */}
      <Modal
        visible={isHistoryModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsHistoryModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>My Feedback History</Text>
                <Text style={styles.modalSubtitle}>
                  Track responses to your submitted suggestions & complaints
                </Text>
              </View>
              <Pressable
                onPress={() => setIsHistoryModalOpen(false)}
                style={styles.modalCloseBtn}
                hitSlop={8}
              >
                <ThemeIcon name="close" size={18} color={Colors.text.primary} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              {historyLoading ? (
                <View style={styles.modalLoading}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.modalLoadingText}>Loading your submissions...</Text>
                </View>
              ) : myHistory.length === 0 ? (
                <View style={styles.modalEmpty}>
                  <ThemeIcon name="star" size={32} color="#94A3B8" />
                  <Text style={styles.modalEmptyTitle}>No submissions yet</Text>
                  <Text style={styles.modalEmptyDesc}>
                    Your submitted suggestions and complaints will appear here along with status updates from the admin.
                  </Text>
                </View>
              ) : (
                myHistory.map((item) => {
                  const statusInfo = getStatusBadge(item.status);
                  return (
                    <View key={item.id} style={styles.historyItemCard}>
                      <View style={styles.historyItemHeader}>
                        <View style={styles.historyTypeTag}>
                          <Text style={styles.historyTypeTagText}>{item.type}</Text>
                        </View>
                        <View
                          style={[
                            styles.historyStatusBadge,
                            { backgroundColor: statusInfo.bg },
                          ]}
                        >
                          <Text
                            style={[
                              styles.historyStatusBadgeText,
                              { color: statusInfo.text },
                            ]}
                          >
                            {statusInfo.label}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.historyMessage}>{item.message}</Text>

                      {item.admin_notes ? (
                        <View style={styles.historyAdminResponse}>
                          <Text style={styles.historyAdminLabel}>Committee Response:</Text>
                          <Text style={styles.historyAdminText}>{item.admin_notes}</Text>
                        </View>
                      ) : null}

                      <Text style={styles.historyDate}>
                        Submitted on{' '}
                        {new Date(item.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextCol: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 1,
    lineHeight: 15,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  typePill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: Radius.round,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  inputWrapper: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  textInput: {
    minHeight: 70,
    fontSize: 13,
    color: Colors.text.primary,
    lineHeight: 18,
    paddingTop: 0,
  },
  charCount: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  historyBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    borderRadius: Radius.round,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '80%',
    paddingBottom: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  modalSubtitle: {
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.round,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  modalLoading: {
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  modalLoadingText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  modalEmpty: {
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  modalEmptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: Spacing.xs,
  },
  modalEmptyDesc: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 17,
  },
  historyItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  historyItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  historyTypeTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    backgroundColor: '#E2E8F0',
  },
  historyTypeTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  historyStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: Radius.round,
  },
  historyStatusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  historyMessage: {
    fontSize: 12,
    color: Colors.text.primary,
    lineHeight: 17,
    marginTop: 4,
  },
  historyAdminResponse: {
    marginTop: Spacing.sm,
    backgroundColor: '#EFF6FF',
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  historyAdminLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
    marginBottom: 2,
  },
  historyAdminText: {
    fontSize: 11,
    color: '#1E293B',
    lineHeight: 16,
  },
  historyDate: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: Spacing.sm,
  },
});

export default SuggestionBoxCard;
