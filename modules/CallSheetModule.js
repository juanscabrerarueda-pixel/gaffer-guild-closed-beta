import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAppSettings } from '../context/AppSettingsContext';
import { useProjectContext } from '../context/ProjectContext';
import { createCallSheet, createCallSheetContact, createInitialCallSheetState } from '../utils/callSheet';
import { measureAsync } from '../utils/perfMetrics';



const CallSheetModule = ({ styles, canEdit = true, canExport = true, onExport }) => {
  const { t, locale, theme } = useAppSettings();
  const localStyles = useMemo(() => buildLocalStyles(theme), [theme]);
  const { currentProject, setProjectCallSheetState, setProjectSunSeekerState } = useProjectContext();
  const callSheetsState = currentProject?.callSheets;
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [dateCursor, setDateCursor] = useState(new Date());
  const [dayInput, setDayInput] = useState('1');

  useEffect(() => {
    if (!callSheetsState && setProjectCallSheetState) {
      setProjectCallSheetState(() => createInitialCallSheetState({ t, locale }));
    }
  }, [callSheetsState, setProjectCallSheetState, t, locale]);

  const callSheets = callSheetsState?.callSheets || [];
  const activeId = callSheetsState?.activeId;
  const orderedCallSheets = useMemo(
    () => [...callSheets].sort((a, b) => (a.dayNumber || 0) - (b.dayNumber || 0)),
    [callSheets],
  );
  const activeCallSheet = useMemo(
    () => orderedCallSheets.find((item) => item.id === activeId) || orderedCallSheets[0],
    [orderedCallSheets, activeId],
  );
  const callSheet = activeCallSheet || createCallSheet({ dayNumber: 1, t, locale });
  const maxDayNumber = orderedCallSheets.length;

  const dayNumber = Number.isFinite(Number(callSheet.dayNumber))
    ? Math.max(1, Number(callSheet.dayNumber))
    : 1;

  useEffect(() => {
    setDayInput(String(dayNumber));
  }, [dayNumber]);

  const formatDate = useCallback((value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toISOString().slice(0, 10);
  }, []);

  const buildMonthMatrix = useCallback((cursor) => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = (firstDay.getDay() + 6) % 7;
    const weeks = [];
    let current = 1 - startOffset;
    while (current <= daysInMonth) {
      const week = [];
      for (let i = 0; i < 7; i += 1) {
        const date = new Date(year, month, current + i);
        week.push({ date, inMonth: date.getMonth() === month });
      }
      weeks.push(week);
      current += 7;
    }
    return weeks;
  }, []);

  const isSameDay = useCallback(
    (a, b) =>
      a &&
      b &&
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate(),
    [],
  );

  const selectedDate = useMemo(() => {
    const value = callSheet?.date;
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [callSheet?.date]);

  const calendarMatrix = useMemo(() => buildMonthMatrix(dateCursor), [buildMonthMatrix, dateCursor]);

  useEffect(() => {
    if (!datePickerVisible) return;
    const baseDate =
      selectedDate && !Number.isNaN(selectedDate.getTime()) ? selectedDate : new Date();
    setDateCursor(baseDate);
  }, [datePickerVisible, selectedDate]);

  const updateField = useCallback(
    (field, value) => {
      if (!setProjectCallSheetState || !canEdit) return;
      measureAsync('callSheet.save', () =>
        setProjectCallSheetState((prev) => ({
          ...prev,
          callSheets: (prev.callSheets || []).map((item) =>
            item.id === callSheet.id
              ? { ...item, [field]: value, updatedAt: Date.now() }
              : item,
          ),
          updatedAt: Date.now(),
        })),
      );
    },
    [setProjectCallSheetState, canEdit, callSheet.id],
  );

  const updateContact = useCallback(
    (contactId, patch) => {
      if (!setProjectCallSheetState || !canEdit) return;
      measureAsync('callSheet.save', () =>
        setProjectCallSheetState((prev) => ({
          ...prev,
          callSheets: (prev.callSheets || []).map((item) =>
            item.id === callSheet.id
              ? {
                  ...item,
                  contacts: (item.contacts || []).map((contact) =>
                    contact.id === contactId ? { ...contact, ...patch } : contact,
                  ),
                  updatedAt: Date.now(),
                }
              : item,
          ),
          updatedAt: Date.now(),
        })),
      );
    },
    [setProjectCallSheetState, canEdit, callSheet.id],
  );

  const handleAddContact = useCallback(() => {
    if (!setProjectCallSheetState || !canEdit) return;
    measureAsync('callSheet.save', () =>
      setProjectCallSheetState((prev) => ({
        ...prev,
        callSheets: (prev.callSheets || []).map((item) =>
          item.id === callSheet.id
            ? {
                ...item,
                contacts: [...(item.contacts || []), createCallSheetContact()],
                updatedAt: Date.now(),
              }
            : item,
        ),
        updatedAt: Date.now(),
      })),
    );
  }, [setProjectCallSheetState, setProjectSunSeekerState, currentProject, canEdit, callSheet.id]);

  const handleRemoveContact = useCallback(
    (contactId) => {
      if (!setProjectCallSheetState || !canEdit) return;
      measureAsync('callSheet.save', () =>
        setProjectCallSheetState((prev) => ({
          ...prev,
          callSheets: (prev.callSheets || []).map((item) =>
            item.id === callSheet.id
              ? {
                  ...item,
                  contacts: (item.contacts || []).filter((contact) => contact.id !== contactId),
                  updatedAt: Date.now(),
                }
              : item,
          ),
          updatedAt: Date.now(),
        })),
      );
    },
    [setProjectCallSheetState, canEdit, callSheet.id],
  );

  const handleSelectDay = useCallback(
    (targetId) => {
      if (!setProjectCallSheetState) return;
      setProjectCallSheetState((prev) => ({
        ...prev,
        activeId: targetId,
        updatedAt: Date.now(),
      }));
    },
    [setProjectCallSheetState],
  );

  const handleSelectOrCreateDay = useCallback(
    (day) => {
      if (!setProjectCallSheetState || !canEdit) return;
      const nextDay = Math.max(1, Math.floor(Number(day) || 1));
      setProjectCallSheetState((prev) => {
        const items = prev.callSheets || [];
        const ordered = [...items].sort((a, b) => (a.dayNumber || 0) - (b.dayNumber || 0));
        const maxDay = ordered.length;
        const existing = ordered.find((item) => item.dayNumber === nextDay);
        if (existing) {
          return { ...prev, activeId: existing.id, updatedAt: Date.now() };
        }
        if (nextDay !== maxDay + 1) {
          return prev;
        }
        const created = createCallSheet({ dayNumber: nextDay, t, locale });
        return {
          ...prev,
          callSheets: [...ordered, created],
          activeId: created.id,
          updatedAt: Date.now(),
        };
      });
    },
    [setProjectCallSheetState, canEdit],
  );

  const handleDayInputSubmit = useCallback(() => {
    const numeric = Number(dayInput);
    if (!Number.isFinite(numeric)) {
      setDayInput(String(dayNumber));
      return;
    }
    const maxAllowed = Math.max(1, maxDayNumber + 1);
    const sanitized = Math.max(1, Math.min(maxAllowed, Math.floor(numeric)));
    setDayInput(String(sanitized));
    handleSelectOrCreateDay(sanitized);
  }, [dayInput, dayNumber, handleSelectOrCreateDay, maxDayNumber]);

  const handleDuplicateDay = useCallback(() => {
    if (!setProjectCallSheetState || !canEdit) return;
    setProjectCallSheetState((prev) => {
      const items = prev.callSheets || [];
      const ordered = [...items].sort((a, b) => (a.dayNumber || 0) - (b.dayNumber || 0));
      const base = ordered.find((item) => item.id === callSheet.id);
      if (!base) return prev;
      const dayToUse = ordered.length + 1;
      const copy = {
        ...base,
        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        dayNumber: dayToUse,
        title: t('callSheet.day.title', { n: dayToUse }),
        updatedAt: Date.now(),
      };
      return {
        ...prev,
        callSheets: [...ordered, copy],
        activeId: copy.id,
        updatedAt: Date.now(),
      };
    });
  }, [setProjectCallSheetState, canEdit, callSheet.id]);

  const handleDeleteDay = useCallback(() => {
    if (!setProjectCallSheetState || !canEdit) return;
    setProjectCallSheetState((prev) => {
      const items = prev.callSheets || [];
      const ordered = [...items].sort((a, b) => (a.dayNumber || 0) - (b.dayNumber || 0));
      if (ordered.length <= 1) {
        const fallback = createCallSheet({ dayNumber: 1, t, locale });
        return {
          ...prev,
          callSheets: [fallback],
          activeId: fallback.id,
          updatedAt: Date.now(),
        };
      }
      const index = ordered.findIndex((item) => item.id === callSheet.id);
      if (index === -1) return prev;
      const remaining = ordered.filter((item) => item.id !== callSheet.id);
      const reindexed = remaining.map((item, idx) => ({
        ...item,
        dayNumber: idx + 1,
        title: t('callSheet.day.title', { n: idx + 1 }),
      }));
      const nextIndex = Math.min(index, reindexed.length - 1);
      const nextActive = reindexed[nextIndex];
      return {
        ...prev,
        callSheets: reindexed,
        activeId: nextActive?.id || reindexed[0].id,
        updatedAt: Date.now(),
      };
    });

    if (setProjectSunSeekerState) {
      const sunDays = currentProject?.sunSeeker?.days || {};
      const ordered = [...(currentProject?.callSheets?.callSheets || [])].sort(
        (a, b) => (a.dayNumber || 0) - (b.dayNumber || 0),
      );
      const remaining = ordered.filter((item) => item.id !== callSheet.id);
      const mappedDays = remaining.map((item, idx) => ({
        oldDay: item.dayNumber,
        newDay: idx + 1,
      }));
      const nextDays = mappedDays.reduce((acc, mapping) => {
        const previous = sunDays[String(mapping.oldDay)];
        if (previous) {
          acc[String(mapping.newDay)] = {
            ...previous,
            dayNumber: mapping.newDay,
            updatedAt: Date.now(),
          };
        }
        return acc;
      }, {});
      setProjectSunSeekerState((prev) => ({
        ...(prev || {}),
        days: nextDays,
        updatedAt: Date.now(),
      }));
    }
  }, [setProjectCallSheetState, canEdit, callSheet.id]);

  const handleExport = useCallback(async () => {
    if (!onExport || !canExport) return;
    await onExport();
  }, [onExport, canExport]);

  const handleMonthChange = useCallback(
    (direction) => {
      const next = new Date(dateCursor);
      next.setMonth(next.getMonth() + direction);
      setDateCursor(next);
    },
    [dateCursor],
  );

  const handleSelectCalendarDay = useCallback(
    (day) => {
      if (!day?.date || !canEdit) return;
      const value = day.date.toISOString().slice(0, 10);
      updateField('date', value);
      setDatePickerVisible(false);
    },
    [updateField, canEdit],
  );

  return (
    <View style={localStyles.root}>
      <View style={localStyles.section}>
        <Text style={localStyles.sectionTitle}>{t('callSheet.section.general')}</Text>
        <View style={localStyles.daySelectorRow}>
          <View style={localStyles.daySelectorHeader}>
            <Text style={localStyles.dayLabel}>{t('callSheet.day.label')}</Text>
            <Text style={localStyles.dayHint}>{t('callSheet.day.hint')}</Text>
          </View>
          <View style={localStyles.daySelectorControls}>
            <TouchableOpacity
              style={localStyles.dayButton}
              onPress={() => handleSelectOrCreateDay(dayNumber - 1)}
              disabled={!canEdit || dayNumber <= 1}
            >
              <Text style={localStyles.dayButtonText}>-</Text>
            </TouchableOpacity>
            <TextInput
              style={[localStyles.dayInput, !canEdit && localStyles.dayInputDisabled]}
              value={dayInput}
              onChangeText={(value) => setDayInput(value.replace(/[^0-9]/g, ''))}
              onEndEditing={handleDayInputSubmit}
              keyboardType="numeric"
              editable={canEdit}
              maxLength={3}
              placeholder="1"
              placeholderTextColor={theme.colors.textMuted}
              selectionColor={theme.colors.accent}
            />
            <TouchableOpacity
              style={localStyles.dayButton}
              onPress={() => handleSelectOrCreateDay(dayNumber + 1)}
              disabled={!canEdit}
            >
              <Text style={localStyles.dayButtonText}>+</Text>
            </TouchableOpacity>
              <TouchableOpacity
                style={[
                  localStyles.dayActionButton,
                  localStyles.dayActionDuplicate,
                  !canEdit && localStyles.dayActionDisabled,
                ]}
                onPress={handleDuplicateDay}
                disabled={!canEdit}
              >
                <View style={localStyles.dayActionIconDup}>
                  <View style={localStyles.dayActionIconDupBack} />
                  <View style={localStyles.dayActionIconDupFront} />
                </View>
                <Text style={localStyles.dayActionText}>{t('callSheet.day.duplicate')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  localStyles.dayActionButton,
                  localStyles.dayActionDelete,
                  !canEdit && localStyles.dayActionDisabled,
                ]}
                onPress={handleDeleteDay}
                disabled={!canEdit}
              >
                <View style={localStyles.dayActionIconDelete}>
                  <View style={localStyles.dayActionIconDeleteBar} />
                </View>
                <Text style={localStyles.dayActionTextDelete}>{t('callSheet.day.delete')}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={localStyles.dayChips}>
            {orderedCallSheets.map((item) => (
              <TouchableOpacity
                key={item.id}
              style={[
                localStyles.dayChip,
                item.id === callSheet.id && localStyles.dayChipActive,
              ]}
              onPress={() => handleSelectDay(item.id)}
            >
              <Text
                style={[
                  localStyles.dayChipText,
                  item.id === callSheet.id && localStyles.dayChipTextActive,
                ]}
              >
                {t('callSheet.day.option', { n: item.dayNumber })}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles?.rowSplit}>
          <TouchableOpacity
            style={[styles?.textInput, localStyles.dateRow]}
            onPress={() => setDatePickerVisible(true)}
            disabled={!canEdit}
          >
            <Text style={localStyles.dateLabel}>{t('callSheet.date.label')}</Text>
            <Text style={localStyles.dateValue}>
              {formatDate(callSheet.date) || t('callSheet.date.select')}
            </Text>
          </TouchableOpacity>
          <TextInput
            style={[styles?.textInput, localStyles.input]}
            placeholder={t('callSheet.location.placeholder')}
            placeholderTextColor={theme.colors.textMuted}
            value={callSheet.location || ''}
            onChangeText={(value) => updateField('location', value)}
            editable={canEdit}
          />
        </View>
        <View style={styles?.rowSplit}>
          <TextInput
            style={[styles?.textInput, localStyles.input]}
            placeholder={t('callSheet.callTime.placeholder')}
            placeholderTextColor={theme.colors.textMuted}
            value={callSheet.callTime || ''}
            onChangeText={(value) => updateField('callTime', value)}
            editable={canEdit}
          />
          <TextInput
            style={[styles?.textInput, localStyles.input]}
            placeholder={t('callSheet.wrap.placeholder')}
            placeholderTextColor={theme.colors.textMuted}
            value={callSheet.wrapTime || ''}
            onChangeText={(value) => updateField('wrapTime', value)}
            editable={canEdit}
          />
        </View>
      </View>

      <View style={localStyles.section}>
        <Text style={localStyles.sectionTitle}>{t('callSheet.section.safety')}</Text>
        <TextInput
          style={[styles?.textInput, localStyles.textArea]}
          placeholder={t('callSheet.safety.placeholder')}
          placeholderTextColor={theme.colors.textMuted}
          value={callSheet.safetyNotes || ''}
          onChangeText={(value) => updateField('safetyNotes', value)}
          editable={canEdit}
          multiline
        />
      </View>

      <View style={localStyles.section}>
        <Text style={localStyles.sectionTitle}>{t('callSheet.section.notes')}</Text>
        <TextInput
          style={[styles?.textInput, localStyles.textArea]}
          placeholder={t('callSheet.notes.placeholder')}
          placeholderTextColor={theme.colors.textMuted}
          value={callSheet.notes || ''}
          onChangeText={(value) => updateField('notes', value)}
          editable={canEdit}
          multiline
        />
      </View>

      <View style={localStyles.section}>
        <View style={localStyles.sectionHeader}>
          <Text style={localStyles.sectionTitle}>{t('callSheet.section.crew')}</Text>
          <TouchableOpacity
            style={[styles?.actionPrimary, !canEdit && styles?.actionPrimaryDisabled]}
            onPress={handleAddContact}
            disabled={!canEdit}
          >
            <Text
              style={[styles?.actionPrimaryText, !canEdit && styles?.actionPrimaryDisabledText]}
              numberOfLines={1}
            >
              {t('callSheet.contact.add')}
            </Text>
          </TouchableOpacity>
        </View>
        {(callSheet.contacts || []).length === 0 ? (
          <Text style={styles?.helperText}>{t('callSheet.contacts.empty')}</Text>
        ) : null}
        {(callSheet.contacts || []).map((contact, index) => (
          <View key={contact.id} style={localStyles.contactCard}>
            <View style={localStyles.contactHeader}>
              <Text style={localStyles.contactTitle}>{t('callSheet.contact.title', { n: index + 1 })}</Text>
              <TouchableOpacity
                style={styles?.actionSecondary}
                onPress={() => handleRemoveContact(contact.id)}
                disabled={!canEdit}
              >
                <Text
                  style={[
                    styles?.actionSecondaryText,
                    !canEdit && styles?.actionSecondaryDisabled,
                  ]}
                >
                  {t('callSheet.contact.remove')}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles?.rowSplit}>
              <TextInput
                style={[styles?.textInput, localStyles.input]}
                placeholder={t('callSheet.contact.name')}
                placeholderTextColor={theme.colors.textMuted}
                value={contact.name || ''}
                onChangeText={(value) => updateContact(contact.id, { name: value })}
                editable={canEdit}
              />
              <TextInput
                style={[styles?.textInput, localStyles.input]}
                placeholder={t('callSheet.contact.role')}
                placeholderTextColor={theme.colors.textMuted}
                value={contact.role || ''}
                onChangeText={(value) => updateContact(contact.id, { role: value })}
                editable={canEdit}
              />
            </View>
            <View style={styles?.rowSplit}>
              <TextInput
                style={[styles?.textInput, localStyles.input]}
                placeholder={t('callSheet.contact.phone')}
                placeholderTextColor={theme.colors.textMuted}
                value={contact.phone || ''}
                onChangeText={(value) => updateContact(contact.id, { phone: value })}
                editable={canEdit}
              />
              <TextInput
                style={[styles?.textInput, localStyles.input]}
                placeholder={t('callSheet.contact.callTime')}
                placeholderTextColor={theme.colors.textMuted}
                value={contact.callTime || ''}
                onChangeText={(value) => updateContact(contact.id, { callTime: value })}
                editable={canEdit}
              />
            </View>
            <View style={styles?.rowSplit}>
              <TextInput
                style={[styles?.textInput, localStyles.input]}
                placeholder={t('callSheet.contact.emergencyName')}
                placeholderTextColor={theme.colors.textMuted}
                value={contact.emergencyName || ''}
                onChangeText={(value) => updateContact(contact.id, { emergencyName: value })}
                editable={canEdit}
              />
              <TextInput
                style={[styles?.textInput, localStyles.input]}
                placeholder={t('callSheet.contact.emergencyPhone')}
                placeholderTextColor={theme.colors.textMuted}
                value={contact.emergencyPhone || ''}
                onChangeText={(value) => updateContact(contact.id, { emergencyPhone: value })}
                editable={canEdit}
              />
            </View>
            <TextInput
              style={[styles?.textInput, localStyles.textArea]}
              placeholder={t('callSheet.contact.dietary')}
              placeholderTextColor={theme.colors.textMuted}
              value={contact.dietary || ''}
              onChangeText={(value) => updateContact(contact.id, { dietary: value })}
              editable={canEdit}
              multiline
            />
            <TextInput
              style={[styles?.textInput, localStyles.textArea]}
              placeholder={t('callSheet.contact.notes')}
              placeholderTextColor={theme.colors.textMuted}
              value={contact.notes || ''}
              onChangeText={(value) => updateContact(contact.id, { notes: value })}
              editable={canEdit}
              multiline
            />
          </View>
        ))}
        {!canEdit ? <Text style={styles?.helperText}>{t('callSheet.helper.locked')}</Text> : null}
      </View>

      <View style={styles?.actionRow}>
        <TouchableOpacity
          style={[styles?.actionPrimary, !canExport && styles?.actionPrimaryDisabled]}
          onPress={handleExport}
          disabled={!canExport}
        >
          <Text
            style={[styles?.actionPrimaryText, !canExport && styles?.actionPrimaryDisabledText]}
            numberOfLines={1}
          >
            {t('callSheet.export.pdf')}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        transparent
        visible={datePickerVisible}
        animationType="fade"
        onRequestClose={() => setDatePickerVisible(false)}
      >
        <Pressable style={localStyles.dateOverlay} onPress={() => setDatePickerVisible(false)}>
          <Pressable
            style={localStyles.datePanel}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={localStyles.dateHeader}>
              <TouchableOpacity
                style={localStyles.dateHeaderButton}
                onPress={() => handleMonthChange(-1)}
              >
                <Text style={localStyles.dateHeaderText}>{'<'}</Text>
              </TouchableOpacity>
              <Text style={localStyles.dateHeaderTitle}>
                {dateCursor.toLocaleDateString(locale === 'en' ? 'en-US' : 'es-ES', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity
                style={localStyles.dateHeaderButton}
                onPress={() => handleMonthChange(1)}
              >
                <Text style={localStyles.dateHeaderText}>{'>'}</Text>
              </TouchableOpacity>
            </View>
            <View style={localStyles.dateGrid}>
              {calendarMatrix.map((week, weekIndex) => (
                <View key={`week-${weekIndex}`} style={localStyles.dateWeek}>
                  {week.map((day) => {
                    const isSelected = selectedDate && isSameDay(day.date, selectedDate);
                    return (
                      <TouchableOpacity
                        key={day.date.toISOString()}
                        style={[
                          localStyles.dateCell,
                          !day.inMonth && localStyles.dateCellMuted,
                          isSelected && localStyles.dateCellActive,
                        ]}
                        onPress={() => handleSelectCalendarDay(day)}
                        disabled={!day.inMonth || !canEdit}
                      >
                        <Text
                          style={[
                            localStyles.dateCellText,
                            !day.inMonth && localStyles.dateCellTextMuted,
                            isSelected && localStyles.dateCellTextActive,
                          ]}
                        >
                          {day.date.getDate()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={[styles?.actionPrimary, localStyles.dateAction]}
              onPress={() => setDatePickerVisible(false)}
            >
              <Text style={styles?.actionPrimaryText}>{t('modal.close', null, 'Close')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const buildLocalStyles = (theme) => {
  const { colors, rgba } = theme;
  return StyleSheet.create({
  root: {
    gap: 12,
  },
  section: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    backgroundColor: colors.surfaceAlt,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: 'PixelHeading',
    fontSize: 12,
    color: colors.text,
    letterSpacing: 1,
  },
  input: {
    minWidth: 200,
    flex: 1,
  },
  dateRow: {
    flex: 1,
    minWidth: 200,
    justifyContent: 'center',
  },
  dateLabel: {
    fontFamily: 'PixelBody',
    fontSize: 11,
    color: colors.textMuted,
  },
  dateValue: {
    fontFamily: 'PixelHeading',
    fontSize: 12,
    color: colors.text,
    letterSpacing: 1,
  },
  textArea: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  daySelectorRow: {
    gap: 8,
  },
  daySelectorHeader: {
    gap: 4,
  },
  dayLabel: {
    fontFamily: 'PixelBody',
    fontSize: 11,
    color: colors.textMuted,
  },
  dayHint: {
    fontFamily: 'PixelBody',
    fontSize: 10,
    color: colors.textMuted,
  },
  daySelectorControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  dayPalette: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  paletteSwatch: {
    width: 18,
    height: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(8,15,30,0.6)',
  },
  dayButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.surfaceAlt,
  },
  dayButtonText: {
    fontFamily: 'PixelHeading',
    fontSize: 12,
    color: colors.text,
  },
  dayInput: {
    minWidth: 44,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    fontFamily: 'PixelHeading',
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  dayInputDisabled: {
    opacity: 0.6,
  },
  dayActionButton: {
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dayActionDuplicate: {
    borderColor: colors.accent,
  },
  dayActionDelete: {
    borderColor: colors.danger,
    backgroundColor: rgba.dangerSoft,
  },
  dayActionDisabled: {
    opacity: 0.6,
  },
  dayActionText: {
    fontFamily: 'PixelHeading',
    fontSize: 11,
    color: colors.accent,
    letterSpacing: 1,
  },
  dayActionTextDelete: {
    fontFamily: 'PixelHeading',
    fontSize: 11,
    color: colors.dangerText,
    letterSpacing: 1,
  },
  dayActionIconDup: {
    width: 14,
    height: 14,
    position: 'relative',
  },
  dayActionIconDupBack: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderWidth: 2,
    borderColor: colors.accent,
    top: 2,
    left: 2,
    backgroundColor: colors.surfaceAlt,
  },
  dayActionIconDupFront: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderWidth: 2,
    borderColor: colors.accent,
    top: 0,
    left: 0,
    backgroundColor: colors.surfaceAlt11,
  },
  dayActionIconDelete: {
    width: 14,
    height: 14,
    borderWidth: 2,
    borderColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: rgba.dangerSoft,
  },
  dayActionIconDeleteBar: {
    width: 8,
    height: 2,
    backgroundColor: colors.dangerText,
  },
  dayChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.surfaceAlt,
  },
  dayChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceAlt7,
    boxShadow: '0 0 0 2px rgba(249,115,22,0.2)',
  },
  dayChipText: {
    fontFamily: 'PixelHeading',
    fontSize: 11,
    color: colors.text,
    letterSpacing: 1,
  },
  dayChipTextActive: {
    color: colors.accent,
  },
  inputSpacer: {
    flex: 1,
    minWidth: 200,
  },
  contactCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 10,
    backgroundColor: colors.surfaceAlt11,
    gap: 8,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  contactTitle: {
    fontFamily: 'PixelHeading',
    fontSize: 11,
    color: colors.accent,
    letterSpacing: 1,
  },
  dateOverlay: {
    flex: 1,
    backgroundColor: 'rgba(4,12,31,0.7)',
    padding: 20,
    justifyContent: 'center',
  },
  datePanel: {
    backgroundColor: colors.surfaceAlt11,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.accent,
    padding: 16,
    gap: 12,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  dateHeaderTitle: {
    fontFamily: 'PixelHeading',
    fontSize: 12,
    color: colors.text,
  },
  dateHeaderButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.surfaceAlt,
  },
  dateHeaderText: {
    fontFamily: 'PixelHeading',
    fontSize: 12,
    color: colors.text,
  },
  dateGrid: {
    gap: 8,
  },
  dateWeek: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dateCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  dateCellMuted: {
    opacity: 0.4,
  },
  dateCellActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  dateCellText: {
    fontFamily: 'PixelHeading',
    fontSize: 11,
    color: colors.text,
  },
  dateCellTextMuted: {
    color: colors.textMuted,
  },
  dateCellTextActive: {
    color: colors.textOnAccent,
  },
  dateAction: {
    alignSelf: 'flex-start',
  },
  });
};

export default CallSheetModule;
