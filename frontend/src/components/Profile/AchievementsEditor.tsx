import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert } from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows, ThemeIcon } from '@/theme';
import { SectionHeader } from '@/components/Layout';
import type { Achievement } from '../../services/authApi';
import { useToast } from '@/components/Toast';

interface AchievementsEditorProps {
  achievements: Achievement[];
  onChange: (next: Achievement[]) => void;
  editable?: boolean;
}

const MAX_ACHIEVEMENTS = 25;

/**
 * "Club Accomplishments & Awards" list with inline add / remove.
 */
export const AchievementsEditor: React.FC<AchievementsEditorProps> = ({
  achievements,
  onChange,
  editable = true,
}) => {
  const toast = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftYear, setDraftYear] = useState('');

  const resetDraft = () => {
    setDraftTitle('');
    setDraftYear('');
    setIsAdding(false);
  };

  const handleAdd = () => {
    const title = draftTitle.trim();
    if (title.length < 3) {
      toast.showWarning('Add Accomplishment', 'Please describe the accomplishment in at least 3 characters.');
      return;
    }
    if (achievements.length >= MAX_ACHIEVEMENTS) {
      toast.showWarning('Limit Reached', `You can list up to ${MAX_ACHIEVEMENTS} accomplishments.`);
      return;
    }

    const year = draftYear.trim();
    onChange([
      ...achievements,
      {
        id: `ach_${Date.now()}_${achievements.length}`,
        title,
        ...(year ? { year } : {}),
      },
    ]);
    resetDraft();
  };

  const handleRemove = (id: string, title: string) => {
    Alert.alert('Remove accomplishment', `Remove "${title}" from your profile?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => onChange(achievements.filter((item) => item.id !== id)),
      },
    ]);
  };

  return (
    <View style={styles.section}>
      <SectionHeader title="Club Accomplishments & Awards" style={styles.sectionHeader} />

      {achievements.length === 0 && !isAdding && (
        <Text style={styles.emptyText}>
          No accomplishments added yet. Showcase your club honours and milestones here.
        </Text>
      )}

      {achievements.map((item) => (
        <View key={item.id} style={styles.achievementRow}>
          <View style={styles.achievementIcon}>
            <ThemeIcon name="star" size={16} color="#F5A524" />
          </View>
          <View style={styles.achievementBody}>
            <Text style={styles.achievementTitle}>{item.title}</Text>
            {!!item.year && <Text style={styles.achievementYear}>{item.year}</Text>}
          </View>
          {editable && (
            <Pressable
              onPress={() => handleRemove(item.id, item.title)}
              style={styles.iconButton}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${item.title}`}
            >
              <ThemeIcon name="delete" size={20} color={Colors.text.outline} />
            </Pressable>
          )}
        </View>
      ))}

      {editable && isAdding && (
        <View style={styles.addCard}>
          <TextInput
            value={draftTitle}
            onChangeText={setDraftTitle}
            placeholder="e.g. Highest Runs Scorer - SEC Summer Cup"
            placeholderTextColor={Colors.text.outline}
            style={styles.input}
            multiline
          />
          <TextInput
            value={draftYear}
            onChangeText={setDraftYear}
            placeholder="Year (optional)"
            placeholderTextColor={Colors.text.outline}
            style={styles.input}
            keyboardType="number-pad"
            maxLength={4}
          />
          <View style={styles.addActions}>
            <Pressable onPress={resetDraft} style={styles.secondaryBtn} accessibilityRole="button">
              <Text style={styles.secondaryBtnText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleAdd} style={styles.primaryBtn} accessibilityRole="button">
              <Text style={styles.primaryBtnText}>Add</Text>
            </Pressable>
          </View>
        </View>
      )}

      {editable && !isAdding && (
        <Pressable
          onPress={() => setIsAdding(true)}
          style={styles.addTrigger}
          accessibilityRole="button"
          accessibilityLabel="Add accomplishment"
        >
          <ThemeIcon name="add" size={18} color={Colors.secondary} />
          <Text style={styles.addTriggerText}>Add Accomplishment</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  sectionHeader: {
    marginTop: 0,
  },
  emptyText: {
    ...Typography.caption,
    color: Colors.text.outline,
    lineHeight: 18,
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: 'rgba(122, 133, 160, 0.15)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  achievementIcon: {
    marginRight: Spacing.md,
  },
  achievementBody: {
    flex: 1,
  },
  achievementTitle: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
    lineHeight: 20,
  },
  achievementYear: {
    ...Typography.caption,
    color: Colors.text.outline,
    marginTop: 2,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCard: {
    borderWidth: 1,
    borderColor: Colors.primaryContainer,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  input: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.text.primary,
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 44,
  },
  addActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  secondaryBtn: {
    minHeight: 44,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    borderRadius: Radius.sm,
  },
  secondaryBtnText: {
    ...Typography.button,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  primaryBtn: {
    minHeight: 44,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
    borderRadius: Radius.sm,
    backgroundColor: Colors.secondary,
  },
  primaryBtnText: {
    ...Typography.button,
    fontSize: 14,
    color: '#FFFFFF',
  },
  addTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    minHeight: 44,
    marginTop: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.secondary,
  },
  addTriggerText: {
    ...Typography.button,
    fontSize: 14,
    color: Colors.secondary,
  },
});

export default AchievementsEditor;
