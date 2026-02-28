import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Alert, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';

import { computeBudgetTotals, computeLineBase } from '../utils/budgetCalculator';

import { useProjectContext } from '../context/ProjectContext';
import { useAppSettings } from '../context/AppSettingsContext';

import {

  CATEGORY_LABELS,

  ITEMS_MASTER,

  createInitialInventory,

  normalizeCustomInventoryItems,

} from '../data/inventoryConstants';

import {

  ensureBudgetDay,

  getBudgetDaysByProjectId,

  getBudgetLinesByDayId,

  getBudgetProjectSnapshot,

  insertBudgetDay,

  replaceBudgetLines,

  updateBudgetDay,

  deleteBudgetDay,

} from '../services/budgetDb';

import { exportBudgetProjectCsv, exportBudgetProjectPdf } from '../services/budgetExport';
import appConfig from '../app.json';
import { logWarn } from '../utils/logging';

import LabeledPicker from '../components/LabeledPicker';

import {

  updateProjectBudgetConfigCountry,

  updateProjectBudgetConfigCurrency,

  updateTaxRule,

} from '../services/budgetConfig';

import { useBudgetConfig } from '../hooks/useBudgetConfig';



const FONT_HEADING = 'PixelHeading';

const FONT_BODY = 'PixelBody';

const WEEKDAY_LABELS = {
  es: ['L', 'M', 'X', 'J', 'V', 'S', 'D'],
  en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
};

const YEAR_RANGE = { past: 4, future: 6 };



const CURRENCY_OPTIONS = [

  { code: 'USD', label: 'USD' },

  { code: 'EUR', label: 'EUR' },

  { code: 'GBP', label: 'GBP' },

  { code: 'COP', label: 'COP' },

  { code: 'MXN', label: 'MXN' },

  { code: 'ARS', label: 'ARS' },

  { code: 'CLP', label: 'CLP' },

  { code: 'BRL', label: 'BRL' },

  { code: 'PEN', label: 'PEN' },

  { code: 'CAD', label: 'CAD' },

  { code: 'JPY', label: 'JPY' },

  { code: 'CNY', label: 'CNY' },

  { code: 'AUD', label: 'AUD' },

  { code: 'CHF', label: 'CHF' },

];



const formatThousands = (value) => {

  const numeric = Number(value);

  if (!Number.isFinite(numeric)) return '0';

  const sign = numeric < 0 ? '-' : '';
  const rounded = Math.round(Math.abs(numeric));
  return `${sign}${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

};



const formatCurrency = (value, currency) => `${currency || 'COP'} ${formatThousands(value)}`;



const clampNumber = (value, min = 0) => {

  const numeric = Number(value);

  if (!Number.isFinite(numeric)) return min;

  return Math.max(min, numeric);

};



const buildMonthMatrix = (cursor) => {

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

};



const buildYearOptions = (year) => {

  const years = [];

  for (let offset = -YEAR_RANGE.past; offset <= YEAR_RANGE.future; offset += 1) {

    years.push(year + offset);

  }

  return years;

};



const isSameDay = (a, b) => {

  if (!a || !b) return false;

  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

};

const normalizeDayLabel = (label = '') => {

  const text = String(label);

  return text.replace(/D[ií]a/gi, 'Dia');

};







const StepperInput = ({ value, onChange, min = 0, step = 1, styles, width = 72 }) => (

  <View style={[styles.stepper, { width }]}>

    <TouchableOpacity

      style={styles.stepperButton}

      onPress={() => onChange(clampNumber(value - step, min))}

    >

      <Text style={styles.stepperButtonText}>-</Text>

    </TouchableOpacity>

    <TextInput

      value={String(value)}

      onChangeText={(text) => onChange(clampNumber(text, min))}

      style={styles.stepperInput}

      keyboardType="numeric"

    />

    <TouchableOpacity

      style={styles.stepperButton}

      onPress={() => onChange(clampNumber(value + step, min))}

    >

      <Text style={styles.stepperButtonText}>+</Text>

    </TouchableOpacity>

  </View>

);



const BudgetModule = ({ canExport = true }) => {

  const { t, locale, theme } = useAppSettings();
  const normalizeCategoryKey = useCallback(
    (value) =>
      (value || 'other')
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase(),
    [],
  );
  const getCategoryLabel = useCallback(
    (category) => {
      const key = normalizeCategoryKey(category);
      return (
        t(`inventory.category.${key}`, null, CATEGORY_LABELS[category]) ||
        t('inventory.category.other')
      );
    },
    [normalizeCategoryKey, t],
  );

  const { currentProject, currentProjectId, setProjectInventoryState } = useProjectContext();

  const { width: screenWidth } = useWindowDimensions();

  const isCompact = screenWidth < 760;
  const styles = useMemo(() => buildStyles(theme), [theme]);

  const { loading, config, rules, error } = useBudgetConfig(currentProjectId);

  const [localConfig, setLocalConfig] = useState({ country: 'CO', currency: 'COP' });

  const [editableRules, setEditableRules] = useState([]);

  const [lines, setLines] = useState([]);

  const [budgetDays, setBudgetDays] = useState([]);

  const [budgetDayId, setBudgetDayId] = useState(null);

  const [isBudgetDayLoading, setIsBudgetDayLoading] = useState(false);

  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const [dateCursor, setDateCursor] = useState(new Date());

  const [yearPickerVisible, setYearPickerVisible] = useState(false);

  const calendarMatrix = useMemo(() => buildMonthMatrix(dateCursor), [dateCursor]);
  const weekdayLabels = useMemo(
    () => (locale === 'en' ? WEEKDAY_LABELS.en : WEEKDAY_LABELS.es),
    [locale],
  );

  const loadingLinesRef = useRef(false);

  const persistStateRef = useRef({ budgetDayId: null, lines: [], currency: 'COP' });

  const inventoryState = useMemo(() => currentProject.inventory || createInitialInventory(), [currentProject.inventory]);

  const bagCounts = inventoryState.inventory || {};

  const catalogStock = inventoryState.catalogStock || {};



  const mapStoredLines = React.useCallback(

    (stored) =>

      stored.map((line) => ({

        id: line.id,

        itemId: line.item_id || null,

        description: line.description,

        category: line.category,

        unit: line.unit,

        quantity: Number(line.quantity || 0),

        days: line.days ?? null,

        weeks: line.weeks ?? null,

        hours: line.hours ?? null,

        unitPrice: Number(line.unit_price || 0),

        discountPct: line.discount_pct ?? null,

        discountAbs: line.discount_abs ?? null,

        fixedTotalOverride: line.fixed_total_override ?? null,

        notes: line.notes ?? null,

      })),

    [],

  );



  const loadBudgetDay = React.useCallback(

    async (targetDayId = null) => {

      if (!currentProjectId) {

        setLines([]);

        setBudgetDayId(null);

        setBudgetDays([]);

        return;

      }

      setIsBudgetDayLoading(true);

      loadingLinesRef.current = true;

      const ensured = await ensureBudgetDay(currentProjectId, { t, locale });

      const days = await getBudgetDaysByProjectId(currentProjectId);

      const sortedDays = [...(days || [])].sort(

        (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime(),

      );

      const nextDayId = targetDayId || ensured.id || sortedDays[0].id || null;

      setBudgetDays(sortedDays);

      setBudgetDayId(nextDayId);

      const needsFix = sortedDays.filter((day) => day.label && !/D[ií]a/i.test(day.label));

      if (needsFix.length) {

        await Promise.all(

          needsFix.map((day) =>

            updateBudgetDay({

              id: day.id,

              projectId: currentProjectId,

              patch: { label: normalizeDayLabel(day.label) },

            }),

          ),

        );

        const refreshed = await getBudgetDaysByProjectId(currentProjectId);

        setBudgetDays(refreshed);

      }

      if (!nextDayId) {

        setLines([]);

        loadingLinesRef.current = false;

        setIsBudgetDayLoading(false);

        return;

      }

      const stored = await getBudgetLinesByDayId(nextDayId);

      setLines(mapStoredLines(stored));

      loadingLinesRef.current = false;

      setIsBudgetDayLoading(false);

    },

    [currentProjectId, mapStoredLines],

  );



  useEffect(() => {

    let active = true;

    const loadLines = async () => {

      if (!active) return;

      await loadBudgetDay();

    };

    loadLines();

    return () => {

      active = false;

    };

  }, [currentProjectId, loadBudgetDay]);



  useEffect(() => {

    setEditableRules(rules);

  }, [rules]);



  const inventoryItems = useMemo(() => {

    const customItems = normalizeCustomInventoryItems(inventoryState.customItems || {});

    const registry = { ...customItems, ...ITEMS_MASTER };

    return Object.values(registry);

  }, [inventoryState]);



  const totals = useMemo(() => {

    const activeRules = editableRules.filter((rule) => rule.active);

    return computeBudgetTotals({

      lines,

      rules: activeRules,

      decimals: 0,

    });

  }, [lines, editableRules]);



  const currencyCode = localConfig.currency || 'COP';

  useEffect(() => {

    persistStateRef.current = { budgetDayId, lines, currency: currencyCode };

  }, [budgetDayId, lines, currencyCode]);

  const sortedLines = useMemo(() => {

    const copy = [...lines];

    copy.sort((a, b) => {

      const aCat = (a.category || '').toString();

      const bCat = (b.category || '').toString();

      if (aCat !== bCat) return aCat.localeCompare(bCat);

      const aName = (a.description || '').toString();

      const bName = (b.description || '').toString();

      return aName.localeCompare(bName);

    });

    return copy;

  }, [lines]);

  const inventoryColumns = screenWidth >= 900 ? 3 : screenWidth >= 640 ? 2 : 1;

  const inventoryCardWidth = `${100 / inventoryColumns}%`;

  const inventoryEntries = useMemo(() => {

    const entries = inventoryItems.filter((item) => (bagCounts[item.id] || 0) > 0);

    return entries.sort((a, b) => {

      const aCat = a.category || '';

      const bCat = b.category || '';

      if (aCat !== bCat) return aCat.localeCompare(bCat);

      return (a.name || '').localeCompare(b.name || '');

    });

  }, [inventoryItems, bagCounts]);



  const isUnlimited = (itemId) => {

    const stored = catalogStock[itemId];

    if (stored === null) return true;

    if (typeof stored === 'number') return false;

    const baseAvailability = inventoryItems.find((item) => item.id === itemId).availability;

    return baseAvailability === null || typeof baseAvailability !== 'number';

  };



  const getRemaining = (itemId) => {

    const stored = catalogStock[itemId];

    if (typeof stored === 'number') return stored;

    const baseAvailability = inventoryItems.find((item) => item.id === itemId).availability;

    if (typeof baseAvailability === 'number') {

      return stored === undefined ? baseAvailability : stored;

    }

    return null;

  };



  const persistInventory = (nextCounts, nextStock) => {

    if (!setProjectInventoryState) return;

    const sanitizedCounts = Object.entries(nextCounts).reduce((acc, [key, value]) => {

      if (value > 0) acc[key] = value;

      return acc;

    }, {});

    setProjectInventoryState((prev) => ({

      ...prev,

      inventory: sanitizedCounts,

      catalogStock: nextStock,

      lastUpdated: Date.now(),

    }));

  };



  const handleInventoryAdd = (itemId, qty = 1) => {

    const current = bagCounts[itemId] || 0;

    const remaining = getRemaining(itemId);

    const allowed = remaining === null ? qty : Math.min(qty, Math.max(remaining, 0));

    if (allowed <= 0) return;

    const nextCounts = { ...bagCounts, [itemId]: current + allowed };

    const nextStock = { ...catalogStock };

    if (remaining !== null) {

      nextStock[itemId] = remaining - allowed;

    } else {

      nextStock[itemId] = null;

    }

    persistInventory(nextCounts, nextStock);

  };



  const handleInventoryRemove = (itemId, qty = 1) => {

    const current = bagCounts[itemId] || 0;

    if (current <= 0) return;

    const delta = Math.min(current, qty);

    const nextCounts = { ...bagCounts };

    const nextValue = current - delta;

    if (nextValue <= 0) {

      delete nextCounts[itemId];

    } else {

      nextCounts[itemId] = nextValue;

    }

    const nextStock = { ...catalogStock };

    if (!isUnlimited(itemId)) {

      const remaining = getRemaining(itemId) || 0;

      nextStock[itemId] = remaining + delta;

    }

    persistInventory(nextCounts, nextStock);

  };



  const handleAddManualLine = () => {

    setLines((prev) => [

      ...prev,

      {

        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,

        itemId: null,

        description: t('budget.line.manual_item'),

        category: 'misc',

        unit: 'day',

        quantity: 1,

        days: 1,

        unitPrice: 0,

      },

    ]);

  };



  const handleRemoveLine = (id) => {

    setLines((prev) => prev.filter((line) => line.id !== id));

  };



  const handleAddLineFromInventory = (item, qty) => {

    if (!item) return;

    const totalQty = clampNumber(qty, 1);

    setLines((prev) => [

      ...prev,

      {

        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,

        itemId: item.id,

        description: item.name,

        category: item.category || 'misc',

        unit: 'day',

        quantity: totalQty,

        days: 1,

        unitPrice: 0,

      },

    ]);

  };



  const hasLineForItem = (itemId) => lines.some((line) => line.itemId === itemId);



  const handleRemoveLinesForItem = (itemId) => {

    if (!itemId) return;

    setLines((prev) => prev.filter((line) => line.itemId !== itemId));

  };



  useEffect(() => {

    if (!budgetDayId || loadingLinesRef.current) return;

    const handle = setTimeout(() => {

      replaceBudgetLines({

        budgetDayId,

        lines,

        currency: currencyCode,

      }).catch(() => {});

    }, 400);

    return () => clearTimeout(handle);

  }, [lines, budgetDayId, currencyCode]);



  const persistLinesNow = React.useCallback(() => {

    const snapshot = persistStateRef.current;

    if (!snapshot.budgetDayId || loadingLinesRef.current) return;

    replaceBudgetLines({

      budgetDayId: snapshot.budgetDayId,

      lines: snapshot.lines,

      currency: snapshot.currency || currencyCode,

    }).catch(() => {});

  }, [currencyCode]);



  useEffect(

    () => () => {

      persistLinesNow();

    },

    [persistLinesNow, currentProjectId, budgetDayId],

  );



  const updateLine = (id, patch) => {

    setLines((prev) => prev.map((line) => (line.id === id ? { ...line, ...patch } : line)));

  };



  const handleRuleChange = (id, patch) => {

    setEditableRules((prev) =>

      prev.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)),

    );

    if (!currentProjectId) return;

    updateTaxRule({

      id,

      projectId: currentProjectId,

      value: patch.value ?? 0,

      active: patch.active ?? false,

    }).catch(() => {});

  };



  const handleConfigChange = (field, value) => {

    setLocalConfig((prev) => ({ ...prev, [field]: value }));

    if (!currentProjectId) return;

    if (field === 'currency') {

      updateProjectBudgetConfigCurrency({ projectId: currentProjectId, currency: value }).catch(() => {});

    }

    if (field === 'country') {

      updateProjectBudgetConfigCountry({ projectId: currentProjectId, country: value }).catch(() => {});

    }

  };



  const handleExportProject = async () => {

    if (!canExport) return;
    if (!currentProjectId) return;

    try {

      const snapshot = await getBudgetProjectSnapshot(currentProjectId);

      await exportBudgetProjectCsv({

        projectName: currentProject.name || t('budget.project'),

        days: snapshot.days || [],

        linesByDayId: snapshot.linesByDayId || {},

        currency: currencyCode,

        rules: editableRules,
        t,
        locale,

        schemaVersion: 1,

        appVersion: appConfig?.expo?.version || '1.0.0',

        projectId: currentProjectId || '',

        generatedAt: Date.now(),

      });

    } catch (error) {

      logWarn('budget-export', error);

      Alert.alert(t('budget.title'), t('budget.alert.export_fail'));


    }

  };



  const handleExportProjectPdf = async () => {

    if (!canExport) return;
    if (!currentProjectId) return;

    try {

      const snapshot = await getBudgetProjectSnapshot(currentProjectId);

      await exportBudgetProjectPdf({

        projectName: currentProject.name || t('budget.project'),

        days: snapshot.days || [],

        linesByDayId: snapshot.linesByDayId || {},

        currency: currencyCode,

        rules: editableRules,
        t,
        locale,

        schemaVersion: 1,

        appVersion: appConfig?.expo?.version || '1.0.0',

        projectId: currentProjectId || '',

        generatedAt: Date.now(),

      });

    } catch (error) {

      logWarn('budget-export', error);

      Alert.alert(t('budget.title'), t('budget.alert.pdf_fail'));


    }

  };



  const budgetDayOptions = useMemo(

    () =>

      budgetDays.map((day) => {

        const label = normalizeDayLabel(day.label || t('budget.day.option', { n: '' }).trim());

        const date = day.date ? ` - ${day.date}` : '';

        return { value: day.id, label: `${label}${date}` };

      }),

    [budgetDays],

  );



  const handleSelectBudgetDay = async (dayId) => {

    if (!dayId || dayId === budgetDayId) return;

    persistLinesNow();

    await loadBudgetDay(dayId);

  };



  const handleAddBudgetDay = async () => {

    if (!currentProjectId) return;

    const days = await getBudgetDaysByProjectId(currentProjectId);

    const nextIndex = (days.length || 0) + 1;

    const id = `${currentProjectId}-day-${nextIndex}`;

    const label = t('budget.day.option', { n: nextIndex });

    await insertBudgetDay({ id, projectId: currentProjectId, label, date: null, status: 'active' });

    await loadBudgetDay(id);

  };



  const handleDeleteBudgetDay = async () => {

    if (!currentProjectId || !budgetDayId) return;

    if (budgetDays.length <= 1) {

      Alert.alert(t('budget.title'), t('budget.alert.min_day'));


      return;

    }

    const doDelete = async () => {

      await deleteBudgetDay({ id: budgetDayId, projectId: currentProjectId });

      const refreshed = await getBudgetDaysByProjectId(currentProjectId);

      setBudgetDays(refreshed);

      const next = refreshed[0].id || null;

      await loadBudgetDay(next);

    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {

      const confirmed = window.confirm(t('budget.alert.delete_msg'));

      if (confirmed) await doDelete();

      return;

    }

    Alert.alert(t('budget.alert.delete_title'), t('budget.alert.delete_msg'), [

      { text: t('modal.cancel'), style: 'cancel' },

      { text: t('budget.alert.delete_action'), style: 'destructive', onPress: doDelete },

    ]);

  };



  const selectedDay = useMemo(

    () => budgetDays.find((day) => day.id === budgetDayId) || null,

    [budgetDays, budgetDayId],

  );



  useEffect(() => {
    if (!datePickerVisible) return;
    const selectedDate = selectedDay?.date;
    const baseDate =
      selectedDate && !Number.isNaN(new Date(selectedDate).getTime()) ? new Date(selectedDate) : new Date();

    setDateCursor(baseDate);

    setYearPickerVisible(false);

  }, [datePickerVisible, selectedDay?.date]);



  const handleUpdateDayDate = async (nextDate) => {

    if (!selectedDay || !currentProjectId) return;

    await updateBudgetDay({ id: selectedDay.id, projectId: currentProjectId, patch: { date: nextDate } });

    const refreshed = await getBudgetDaysByProjectId(currentProjectId);

    setBudgetDays(refreshed);

  };



  const handleSelectCalendarDay = (day) => {

    if (!day.date) return;

    const iso = day.date.toISOString().slice(0, 10);

    handleUpdateDayDate(iso);

    setDatePickerVisible(false);

  };



  const handleMonthChange = (offset) => {

    const next = new Date(dateCursor);

    next.setMonth(next.getMonth() + offset);

    setDateCursor(next);

  };



  const handleYearSelect = (year) => {

    const next = new Date(dateCursor);

    next.setFullYear(year);

    setDateCursor(next);

    setYearPickerVisible(false);

  };



  const yearOptions = useMemo(() => buildYearOptions(dateCursor.getFullYear()), [dateCursor]);

  const selectedDate = useMemo(() => {
    if (!selectedDay?.date) return null;
    const parsed = new Date(selectedDay.date);

    return Number.isNaN(parsed.getTime()) ? null : parsed;

  }, [selectedDay?.date]);



  return (

    <View style={styles.wrapper}>

      <View style={styles.summaryCard}>

        <Text style={styles.summaryTitle}>{t('budget.title')}</Text>

        <Text style={styles.summaryText}>

          {t('budget.project')}: {currentProject.name || t('budget.project.none')}

        </Text>

        <View style={[styles.dayRow, isCompact && styles.dayRowStacked]}>

          <LabeledPicker

            styles={styles}

            label={t('budget.day.label')}

            selectedValue={budgetDayId}

            onValueChange={handleSelectBudgetDay}

            options={budgetDayOptions}

          />

          <View style={styles.dayButtonColumn}>

            <TouchableOpacity

              style={[styles.dayAddButton, isBudgetDayLoading && styles.dayAddButtonDisabled]}

              onPress={handleAddBudgetDay}

              disabled={isBudgetDayLoading}

            >

              <Text style={styles.dayAddButtonText}>{t('budget.day.new')}</Text>

            </TouchableOpacity>

            <TouchableOpacity

              style={[

                styles.dayDeleteButton,

                (isBudgetDayLoading || budgetDays.length <= 1) && styles.dayAddButtonDisabled,

              ]}

              onPress={handleDeleteBudgetDay}

              disabled={isBudgetDayLoading || budgetDays.length <= 1}

            >

              <Text style={styles.dayDeleteButtonText}>{t('budget.day.delete')}</Text>

            </TouchableOpacity>

          </View>

        </View>

        <Pressable

          style={styles.dayDateRow}

          onPress={() => setDatePickerVisible(true)}

          onPressIn={() => setDatePickerVisible(true)}

          onStartShouldSetResponder={() => true}

          onResponderRelease={() => setDatePickerVisible(true)}

        >

          <Text style={styles.dayDateLabel}>{t('budget.date.label')}</Text>

          <Text style={styles.dayDateValue}>{selectedDay?.date || t('budget.date.select')}</Text>

        </Pressable>

        {loading ? <Text style={styles.summaryMuted}>{t('budget.loading')}</Text> : null}

        {error ? <Text style={styles.summaryError}>{t('budget.error')}</Text> : null}

        {!loading && !error && (

        <View style={[styles.configRow, isCompact && styles.configRowStacked]}>

            <View style={styles.configField}>

              <Text style={styles.configLabel}>{t('budget.country')}</Text>

              <TextInput

                value={localConfig.country}

                onChangeText={(value) => handleConfigChange('country', value)}

                style={styles.configInput}

                autoCapitalize="characters"

              />

            </View>

            <View style={styles.configField}>

              <Text style={styles.configLabel}>{t('budget.currency')}</Text>

              <View style={styles.currencyRow}>

                {CURRENCY_OPTIONS.map((option) => {

                  const active = option.code === currencyCode;

                  return (

                    <TouchableOpacity

                      key={option.code}

                      style={[styles.currencyChip, active && styles.currencyChipActive]}

                      onPress={() => handleConfigChange('currency', option.code)}

                    >

                      <Text style={[styles.currencyChipText, active && styles.currencyChipTextActive]}>

                        {option.label}

                      </Text>

                    </TouchableOpacity>

                  );

                })}

              </View>

            </View>

          </View>

        )}

        <View style={styles.summaryActions}>

          <TouchableOpacity
            style={[styles.exportButton, !canExport && styles.exportButtonDisabled]}
            onPress={handleExportProject}
            disabled={!canExport}
          >

            <Text style={[styles.exportButtonText, !canExport && styles.exportButtonTextDisabled]}>
              {t('budget.export.csv')}
            </Text>

          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.exportButton, !canExport && styles.exportButtonDisabled]}
            onPress={handleExportProjectPdf}
            disabled={!canExport}
          >

            <Text style={[styles.exportButtonText, !canExport && styles.exportButtonTextDisabled]}>
              {t('budget.export.pdf')}
            </Text>

          </TouchableOpacity>

        </View>

      </View>



      <View style={styles.panel}>

        <Text style={styles.panelTitle}>{t('budget.lines.title')}</Text>

        <View style={styles.panelActions}>

          <TouchableOpacity style={styles.addLineButton} onPress={handleAddManualLine}>

            <Text style={styles.addLineButtonText}>{t('budget.lines.add_manual')}</Text>

          </TouchableOpacity>

        </View>

        {!isCompact && (
          <View style={[styles.lineHeaderRow, isCompact && styles.lineHeaderRowStacked]}>
            <View style={styles.lineColItem}>
              <Text style={[styles.lineHeaderText, styles.lineHeaderItem, isCompact && styles.lineHeaderItemStacked]}>
                {t('budget.headers.item')}
              </Text>
            </View>
            <View style={styles.lineColQty}>
              <Text style={[styles.lineHeaderText, styles.lineHeaderQty, isCompact && styles.lineHeaderQtyStacked]}>
                {t('budget.headers.qty')}
              </Text>
            </View>
            <View style={styles.lineColDays}>
              <Text style={[styles.lineHeaderText, styles.lineHeaderDays, isCompact && styles.lineHeaderDaysStacked]}>
                {t('budget.headers.days')}
              </Text>
            </View>
            <View style={styles.lineColPrice}>
              <Text style={[styles.lineHeaderText, styles.lineHeaderPrice, isCompact && styles.lineHeaderPriceStacked]}>
                {t('budget.headers.price')}
              </Text>
            </View>
            <View style={styles.lineColTotal}>
              <Text style={[styles.lineHeaderText, styles.lineHeaderTotal, isCompact && styles.lineHeaderTotalStacked]}>
                {t('budget.headers.total')}
              </Text>
            </View>
            <View style={styles.lineColType}>
              <Text style={[styles.lineHeaderText, styles.lineHeaderType, isCompact && styles.lineHeaderTypeStacked]}>
                {t('budget.headers.type')}
              </Text>
            </View>
            <View style={styles.lineColAction}>
              <Text style={[styles.lineHeaderText, styles.lineHeaderAction, isCompact && styles.lineHeaderActionStacked]}>
                {t('budget.headers.action')}
              </Text>
            </View>
          </View>
        )}

        {sortedLines.length ? (

          sortedLines.map((line) => (

            <View key={line.id} style={[styles.lineRow, isCompact && styles.lineRowStacked]}>

              <View style={[styles.lineColItem, isCompact && styles.lineFieldStack]}>
                {isCompact && <Text style={styles.lineFieldLabel}>{t('budget.headers.item')}</Text>}
                <TextInput
                  value={line.description}
                  onChangeText={(value) => updateLine(line.id, { description: value })}
                  style={[styles.lineItemInput, isCompact && styles.lineItemInputStacked]}
                  placeholder={t('budget.line.placeholder.item')}
                  placeholderTextColor={theme.colors.textMuted}
                />
              </View>

              <View style={[styles.lineColQty, isCompact && styles.lineFieldStack]}>
                {isCompact && <Text style={styles.lineFieldLabel}>{t('budget.headers.qty')}</Text>}
                <StepperInput
                  styles={styles}
                  value={clampNumber(line.quantity, 1)}
                  min={1}
                  step={1}
                  width={isCompact ? '100%' : 92}
                  onChange={(value) => updateLine(line.id, { quantity: value })}
                />
              </View>

              <View style={[styles.lineColDays, isCompact && styles.lineFieldStack]}>
                {isCompact && <Text style={styles.lineFieldLabel}>{t('budget.headers.days')}</Text>}
                <StepperInput
                  styles={styles}
                  value={clampNumber(line.days || 1, 1)}
                  min={1}
                  step={1}
                  width={isCompact ? '100%' : 92}
                  onChange={(value) => updateLine(line.id, { days: value })}
                />
              </View>

              <View style={[styles.lineColPrice, isCompact && styles.lineFieldStack]}>
                {isCompact && <Text style={styles.lineFieldLabel}>{t('budget.headers.price')}</Text>}
                <TextInput
                  value={String(line.unitPrice || 0)}
                  onChangeText={(value) => updateLine(line.id, { unitPrice: clampNumber(value, 0) })}
                  style={[styles.linePriceInput, isCompact && styles.linePriceInputStacked]}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.lineColTotal, isCompact && styles.lineFieldStack]}>
                {isCompact && <Text style={styles.lineFieldLabel}>{t('budget.headers.total')}</Text>}
                <Text style={[styles.lineTotal, isCompact && styles.lineTotalStacked]}>
                  {formatCurrency(computeLineBase(line), currencyCode)}
                </Text>
              </View>

              <View style={[styles.lineColType, isCompact && styles.lineFieldStack]}>
                {isCompact && <Text style={styles.lineFieldLabel}>{t('budget.headers.type')}</Text>}
                <TextInput
                  value={line.category || 'misc'}
                  onChangeText={(value) => updateLine(line.id, { category: value })}
                  style={[styles.lineTypeInput, isCompact && styles.lineTypeInputStacked]}
                  placeholder={t('budget.line.placeholder.type')}
                  placeholderTextColor={theme.colors.textMuted}
                />
              </View>

              <View style={[styles.lineColAction, isCompact && styles.lineFieldStack]}>
                {isCompact && <Text style={styles.lineFieldLabel}>{t('budget.headers.action')}</Text>}
                <TouchableOpacity
                  style={[styles.lineRemove, isCompact && styles.lineRemoveStacked]}
                  onPress={() => handleRemoveLine(line.id)}
                >
                  <Text style={styles.lineRemoveText}>{t('budget.line.remove')}</Text>
                </TouchableOpacity>
              </View>

            </View>

          ))
        ) : (

          <Text style={styles.panelMuted}>{t('budget.lines.empty')}</Text>

        )}

      </View>



      <Modal transparent visible={datePickerVisible} animationType="fade" onRequestClose={() => setDatePickerVisible(false)}>

        <Pressable style={styles.dateOverlay} onPress={() => setDatePickerVisible(false)}>

          <Pressable style={styles.datePanel} onPress={(event) => event.stopPropagation()}>

            <Text style={styles.sectionTitle}>{t('budget.date.title')}</Text>

            <View style={styles.dateHeader}>

              <TouchableOpacity style={styles.monthNavButton} onPress={() => handleMonthChange(-1)}>

                <Text style={styles.monthNavText}>{'<'}</Text>

              </TouchableOpacity>

              <Text style={styles.monthTitleText}>

                {dateCursor.toLocaleDateString(locale === 'en' ? 'en-US' : 'es-ES', { month: 'long', year: 'numeric' })}

              </Text>

              <TouchableOpacity style={styles.monthNavButton} onPress={() => handleMonthChange(1)}>

                <Text style={styles.monthNavText}>{'>'}</Text>

              </TouchableOpacity>

            </View>

            <TouchableOpacity style={styles.yearToggle} onPress={() => setYearPickerVisible((prev) => !prev)}>

              <Text style={styles.yearToggleText}>{dateCursor.getFullYear()}</Text>

            </TouchableOpacity>

            {yearPickerVisible && (

              <ScrollView style={styles.yearList} contentContainerStyle={styles.yearListContent} showsVerticalScrollIndicator={false}>

                {yearOptions.map((year) => (

                  <TouchableOpacity

                    key={year}

                    onPress={() => handleYearSelect(year)}

                    style={[styles.yearItem, year === dateCursor.getFullYear() && styles.yearItemActive]}

                  >

                    <Text style={[styles.yearItemText, year === dateCursor.getFullYear() && styles.yearItemTextActive]}>

                      {year}

                    </Text>

                  </TouchableOpacity>

                ))}

              </ScrollView>

            )}

            <View style={styles.weekdayRow}>

              {weekdayLabels.map((day) => (

                <Text key={day} style={styles.weekdayLabel}>

                  {day}

                </Text>

              ))}

            </View>

            <CalendarGrid

              styles={styles}

              matrix={calendarMatrix}

              selectedDate={selectedDate}

              onSelectDay={handleSelectCalendarDay}

            />

          </Pressable>

        </Pressable>

      </Modal>



      <View style={styles.panel}>

        <Text style={styles.panelTitle}>{t('budget.rules.title')}</Text>

        {editableRules.length ? (

          editableRules.map((rule) => (

            <View key={rule.id} style={styles.ruleRow}>

              <Text style={styles.ruleName}>{rule.name}</Text>

              <View style={styles.ruleControls}>

                <TextInput

                  value={String(rule.value)}

                  onChangeText={(value) => handleRuleChange(rule.id, { value: Number(value || 0) })}

                  style={styles.ruleInput}

                  keyboardType="numeric"

                />

                <TouchableOpacity

                  onPress={() => handleRuleChange(rule.id, { active: !rule.active, value: rule.value })}

                  style={[styles.ruleToggle, rule.active && styles.ruleToggleActive]}

                >

                  <Text style={styles.ruleToggleText}>
                    {rule.active ? t('budget.rules.on') : t('budget.rules.off')}
                  </Text>

                </TouchableOpacity>

              </View>

            </View>

          ))
        ) : (

          <Text style={styles.panelMuted}>{t('budget.rules.empty')}</Text>

        )}

      </View>



      <View style={styles.panel}>
        <Text style={styles.panelTitle}>{t('budget.inventory.title')}</Text>
        <Text style={styles.panelMuted}>{t('budget.inventory.sync')}</Text>
        <View style={styles.inventoryGrid}>
          {inventoryEntries.length > 0 ? (
            inventoryEntries.map((item) => (
              <View key={item.id} style={[styles.inventoryCard, { flexBasis: inventoryCardWidth }]}>
                <View style={styles.inventoryInfo}>
                  {item.icon && (
                    <Image source={item.icon} style={styles.inventoryIcon} resizeMode="contain" />
                  )}
                  <View style={styles.inventoryTextStack}>
                    <Text style={styles.inventoryName}>{item.name}</Text>
                    <Text style={styles.inventoryCategory}>
                      {getCategoryLabel(item.category) || item.category}
                    </Text>
                    {hasLineForItem(item.id) && (
                      <Text style={styles.inventoryBudgetTag}>{t('budget.inventory.in_budget')}</Text>
                    )}
                  </View>
                </View>
                <View style={[styles.inventoryControls, isCompact && styles.inventoryControlsStacked]}>
                  <TouchableOpacity
                    style={[
                      styles.inventoryQtyButton,
                      isCompact && styles.inventoryQtyButtonStacked,
                      (bagCounts[item.id] || 0) === 0 && styles.inventoryQtyButtonDisabled,
                    ]}
                    onPress={() => handleInventoryRemove(item.id, 1)}
                    disabled={(bagCounts[item.id] || 0) === 0}
                  >
                    <Text style={styles.inventoryQtyButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.inventoryQtyValue}>{bagCounts[item.id] || 0}</Text>
                  <TouchableOpacity
                    style={[styles.inventoryQtyButton, isCompact && styles.inventoryQtyButtonStacked]}
                    onPress={() => handleInventoryAdd(item.id, 1)}
                  >
                    <Text style={styles.inventoryQtyButtonText}>+</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.inventoryAddLineButton}
                    onPress={() => handleAddLineFromInventory(item, bagCounts[item.id] || 1)}
                  >
                    <Text style={styles.inventoryAddLineText}>{t('budget.lines.add_from_inventory')}</Text>
                  </TouchableOpacity>
                  {hasLineForItem(item.id) && (
                    <TouchableOpacity
                      style={styles.inventoryRemoveLineButton}
                      onPress={() => handleRemoveLinesForItem(item.id)}
                    >
                      <Text style={styles.inventoryRemoveLineText}>{t('budget.line.remove')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.panelMuted}>{t('budget.inventory.empty')}</Text>
          )}
        </View>
      </View>


      <View style={styles.panel}>

        <Text style={styles.panelTitle}>{t('budget.summary.title')}</Text>

        <View style={styles.summaryRow}>

          <Text style={styles.summaryLabel}>{t('budget.summary.subtotal')}</Text>

          <Text style={styles.summaryValue}>{formatCurrency(totals.subtotal, currencyCode)}</Text>

        </View>

        <View style={styles.summaryRow}>

          <Text style={styles.summaryLabel}>{t('budget.summary.taxes')}</Text>

          <Text style={styles.summaryValue}>

            {formatCurrency(totals.rulesBreakdown.reduce((sum, rule) => sum + rule.amount, 0), currencyCode)}

          </Text>

        </View>

        <View style={styles.summaryRow}>

          <Text style={styles.summaryLabel}>{t('budget.headers.total')}</Text>

          <Text style={styles.summaryValueStrong}>{formatCurrency(totals.grandTotal, currencyCode)}</Text>

        </View>

      </View>

    </View>

  );

};





const CalendarGrid = React.memo(({ styles, matrix, selectedDate, onSelectDay }) => (

  <View style={styles.calendarGrid}>

    {matrix.map((week, index) => (

      <View key={`week-${index}`} style={styles.calendarWeek}>

        {week.map((day, dayIndex) => {

          if (!day || !day.date) {

            return (

              <View

                key={`empty-${index}-${dayIndex}`}

                style={styles.calendarDayPlaceholder}

              />

            );

          }

          const isInMonth = day.inMonth;

          const isSelected = selectedDate && isSameDay(day.date, selectedDate);

          return (

            <TouchableOpacity

              key={day.date.toISOString()}

              onPress={() => onSelectDay(day)}

              style={[

                styles.calendarDay,

                !isInMonth && styles.calendarDayMuted,

                isSelected && styles.calendarDaySelected,

              ]}

            >

              <Text

                style={[

                  styles.calendarDayText,

                  !isInMonth && styles.calendarDayTextMuted,

                  isSelected && styles.calendarDayTextSelected,

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

));



CalendarGrid.displayName = 'CalendarGrid';



const buildStyles = (theme) => {
  const { colors, rgba } = theme;
  return StyleSheet.create({

  wrapper: {

    gap: 16,

  },

  summaryCard: {

    borderRadius: 18,

    borderWidth: 1,

    borderColor: rgba.accentSoft,

    backgroundColor: colors.surfaceAlt,

    padding: 16,

  },

  summaryTitle: {

    fontFamily: FONT_HEADING,

    fontSize: 12,

    color: colors.warning,

    marginBottom: 6,

  },

  summaryText: {

    fontFamily: FONT_BODY,

    fontSize: 14,

    color: colors.text,

  },

  dayDateRow: {

    marginTop: 8,

    gap: 4,

    borderWidth: 1,

    borderColor: colors.border,

    borderRadius: 10,

    paddingHorizontal: 10,

    paddingVertical: 8,

    backgroundColor: colors.surfaceAlt11,

  },

  dayDateLabel: {

    fontFamily: FONT_BODY,

    fontSize: 11,

    color: colors.textMuted,

  },

  dayDateValue: {

    fontFamily: FONT_BODY,

    fontSize: 12,

    color: colors.text,

  },

  dayRow: {

    marginTop: 8,

    flexDirection: 'row',

    alignItems: 'flex-end',

    gap: 10,

    flexWrap: 'wrap',

  },

  dayRowStacked: {

    flexDirection: 'column',

    alignItems: 'stretch',

  },

  pickerRow: {

    flex: 1,

    gap: 4,

  },

  inputLabel: {

    fontFamily: FONT_BODY,

    fontSize: 11,

    color: colors.textMuted,

  },
  fieldRow: {
    gap: 4,
  },
  fieldLabel: {
    fontFamily: FONT_BODY,
    fontSize: 11,
    color: colors.textMuted,
  },
  pickerTrigger: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.surfaceAlt11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerTriggerText: {
    fontFamily: FONT_BODY,
    fontSize: 12,
    color: colors.text,
  },
  pickerTriggerIcon: {
    width: 10,
    height: 10,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.textMuted,
    transform: [{ rotate: '45deg' }],
    marginLeft: 8,
  },
  pickerModal: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    maxHeight: '70%',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  pickerList: {
    maxHeight: 320,
  },
  pickerOption: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.surfaceAlt11,
  },
  pickerOptionActive: {
    borderColor: colors.info,
    backgroundColor: colors.surfaceAlt7,
  },
  pickerOptionText: {
    fontFamily: FONT_BODY,
    fontSize: 12,
    color: colors.textSubtle,
  },
  pickerOptionTextActive: {
    fontFamily: FONT_HEADING,
    color: colors.info,
  },

  dropdownTrigger: {

    borderWidth: 1,

    borderColor: colors.border,

    borderRadius: 10,

    paddingHorizontal: 10,

    paddingVertical: 8,

    backgroundColor: colors.surfaceAlt11,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

  },

  dropdownText: {

    fontFamily: FONT_BODY,

    fontSize: 12,

    color: colors.text,

  },

  dropdownIcon: {

    width: 10,

    height: 10,

    borderRightWidth: 2,

    borderBottomWidth: 2,

    borderColor: colors.textMuted,

    transform: [{ rotate: '45deg' }],

    marginLeft: 8,

  },

  dropdownOverlay: {

    flex: 1,

    backgroundColor: 'rgba(2, 6, 23, 0.6)',

    justifyContent: 'center',

    padding: 24,

  },

  dropdownOverlayPicker: {

    flex: 1,

    backgroundColor: 'rgba(2, 6, 23, 0.6)',

    justifyContent: 'center',

    padding: 24,

  },

  dropdownBackdrop: {

    position: 'absolute',

    left: 0,

    top: 0,

    right: 0,

    bottom: 0,

  },

  dropdownPanel: {

    backgroundColor: colors.surfaceAlt,

    borderRadius: 16,

    borderWidth: 1,

    borderColor: colors.border,

    padding: 16,

    maxHeight: '70%',

  },

  dropdownPanelPicker: {

    maxWidth: 420,

    alignSelf: 'center',

    width: '100%',

  },

  dropdownPanelTitle: {

    fontFamily: FONT_HEADING,

    fontSize: 10,

    color: colors.warning,

    marginBottom: 10,

  },

  dropdownList: {

    maxHeight: 320,

  },

  dropdownListContent: {

    gap: 6,

  },

  dropdownItem: {

    borderWidth: 1,

    borderColor: colors.border,

    borderRadius: 10,

    paddingHorizontal: 10,

    paddingVertical: 8,

    backgroundColor: colors.surfaceAlt11,

  },

  dropdownItemActive: {

    borderColor: colors.info,

    backgroundColor: colors.surfaceAlt7,

  },

  dropdownItemText: {

    fontFamily: FONT_BODY,

    fontSize: 12,

    color: colors.textSubtle,

  },

  dropdownItemTextActive: {

    fontFamily: FONT_HEADING,

    color: colors.info,

  },

  dayAddButton: {

    borderWidth: 1,

    borderColor: colors.info,

    borderRadius: 10,

    paddingHorizontal: 10,

    paddingVertical: 8,

    backgroundColor: colors.surfaceAlt11,

  },

  dayAddButtonDisabled: {

    opacity: 0.6,

  },

  dayAddButtonText: {

    fontFamily: FONT_HEADING,

    fontSize: 10,

    color: colors.info,

  },

  dayDeleteButton: {

    borderWidth: 1,

    borderColor: colors.danger,

    borderRadius: 10,

    paddingHorizontal: 10,

    paddingVertical: 8,

    backgroundColor: rgba.dangerSoft,

  },

  dayDeleteButtonText: {

    fontFamily: FONT_HEADING,

    fontSize: 10,

    color: colors.dangerText,

  },

  dateOverlay: {

    flex: 1,

    backgroundColor: 'rgba(4,7,15,0.85)',

    justifyContent: 'center',

    padding: 24,

  },

  datePanel: {

    backgroundColor: colors.surfaceAlt,

    borderRadius: 16,

    borderWidth: 1,

    borderColor: colors.border,

    padding: 16,

    width: '100%',

    maxWidth: 420,

    alignSelf: 'center',

  },

  sectionTitle: {

    fontFamily: FONT_HEADING,

    fontSize: 11,

    color: colors.warning,

  },

  dateHeader: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    marginTop: 12,

  },

  monthNavButton: {

    width: 36,

    height: 36,

    borderRadius: 18,

    borderWidth: 1,

    borderColor: colors.borderStrong,

    alignItems: 'center',

    justifyContent: 'center',

  },

  monthNavText: {

    color: colors.text,

    fontSize: 18,

    fontWeight: '700',

  },

  monthTitleText: {

    color: colors.text,

    fontSize: 18,

    fontWeight: '700',

    textTransform: 'capitalize',

  },

  yearToggle: {

    marginTop: 12,

    alignSelf: 'flex-start',

    paddingHorizontal: 12,

    paddingVertical: 6,

    borderRadius: 999,

    borderWidth: 1,

    borderColor: colors.borderStrong,

  },

  yearToggleText: {

    color: colors.textSubtle,

    fontSize: 13,

    fontWeight: '600',

    letterSpacing: 1,

  },

  yearList: {

    maxHeight: 140,

    marginTop: 8,

    borderRadius: 12,

    borderWidth: 1,

    borderColor: colors.borderStrong,

    backgroundColor: colors.surfaceAlt11,

  },

  yearListContent: {

    paddingVertical: 6,

  },

  yearItem: {

    paddingVertical: 8,

    alignItems: 'center',

  },

  yearItemActive: {

    backgroundColor: 'rgba(59,130,246,0.15)',

  },

  yearItemText: {

    color: colors.textSubtle,

    fontSize: 14,

  },

  yearItemTextActive: {

    fontWeight: '700',

    color: colors.link,

  },

  weekdayRow: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    marginTop: 16,

    marginBottom: 4,

  },

  weekdayLabel: {

    flex: 1,

    textAlign: 'center',

    color: colors.textMuted,

    fontSize: 11,

    fontWeight: '700',

  },

  calendarGrid: {

    gap: 6,

  },

  calendarWeek: {

    flexDirection: 'row',

    gap: 6,

  },

  calendarDay: {

    flex: 1,

    aspectRatio: 1,

    borderRadius: 10,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: colors.surfaceAlt8,

  },

  calendarDayPlaceholder: {

    flex: 1,

    aspectRatio: 1,

    borderRadius: 10,

    backgroundColor: 'transparent',

  },

  calendarDayMuted: {

    opacity: 0.35,

  },

  calendarDaySelected: {

    backgroundColor: colors.link,

  },

  calendarDayText: {

    color: colors.text,

    fontWeight: '600',

  },

  calendarDayTextMuted: {

    color: colors.textMuted,

  },

  calendarDayTextSelected: {

    color: colors.text,

  },

  summaryMuted: {

    fontFamily: FONT_BODY,

    fontSize: 12,

    color: colors.textMuted,

    marginTop: 6,

  },

  summaryError: {

    fontFamily: FONT_BODY,

    fontSize: 12,

    color: colors.danger,

    marginTop: 6,

  },

  summaryActions: {

    marginTop: 10,

    alignItems: 'flex-start',

    gap: 6,

  },

  exportButton: {

    borderWidth: 1,

    borderColor: colors.info,

    borderRadius: 10,

    paddingHorizontal: 10,

    paddingVertical: 6,

    backgroundColor: colors.surfaceAlt11,

  },
  exportButtonDisabled: {

    opacity: 0.5,

  },

  exportButtonText: {

    fontFamily: FONT_HEADING,

    fontSize: 10,

    color: colors.info,

  },
  exportButtonTextDisabled: {

    color: colors.textMuted,

  },

  configRow: {

    marginTop: 8,

    flexDirection: 'row',

    gap: 12,

  },

  configRowStacked: {

    flexDirection: 'column',

  },

  configField: {

    flex: 1,

    gap: 4,

  },

  configLabel: {

    fontFamily: FONT_BODY,

    fontSize: 11,

    color: colors.textMuted,

  },

  configInput: {

    borderWidth: 1,

    borderColor: colors.border,

    borderRadius: 10,

    paddingHorizontal: 8,

    paddingVertical: 6,

    color: colors.text,

    backgroundColor: colors.surfaceAlt11,

    fontFamily: FONT_BODY,

    fontSize: 12,

  },

  currencyRow: {

    flexDirection: 'row',

    flexWrap: 'wrap',

    gap: 6,

  },

  currencyChip: {

    borderWidth: 1,

    borderColor: colors.border,

    borderRadius: 10,

    paddingHorizontal: 8,

    paddingVertical: 4,

    backgroundColor: colors.surfaceAlt11,

  },

  currencyChipActive: {

    borderColor: colors.warning,

    backgroundColor: colors.surfaceAlt7,

  },

  currencyChipText: {

    fontFamily: FONT_BODY,

    fontSize: 11,

    color: colors.textSubtle,

  },

  currencyChipTextActive: {

    fontFamily: FONT_HEADING,

    color: colors.warning,

  },

  panel: {

    borderRadius: 18,

    borderWidth: 1,

    borderColor: colors.border,

    backgroundColor: colors.surfaceAlt,

    padding: 14,

    gap: 10,

  },

  panelTitle: {

    fontFamily: FONT_HEADING,

    fontSize: 11,

    color: colors.accent,

    letterSpacing: 1,

  },

  panelActions: {

    alignItems: 'flex-start',

  },

  addLineButton: {

    borderWidth: 1,

    borderColor: colors.accent,

    borderRadius: 10,

    paddingHorizontal: 10,

    paddingVertical: 6,

    backgroundColor: colors.surfaceAlt2,

  },

  addLineButtonText: {

    fontFamily: FONT_HEADING,

    fontSize: 10,

    color: colors.accent,

  },

  panelMuted: {

    fontFamily: FONT_BODY,

    fontSize: 12,

    color: colors.textMuted,

  },

  lineHeaderRow: {

    flexDirection: 'row',

    justifyContent: 'flex-start',

    alignItems: 'center',

    gap: 8,

    paddingHorizontal: 8,

  },

  lineHeaderRowStacked: {

    flexDirection: 'column',

    alignItems: 'flex-start',

    paddingHorizontal: 4,

  },

  lineHeaderText: {

    fontFamily: FONT_HEADING,

    fontSize: 10,

    color: colors.warning,

  },

  lineHeaderItem: {
    textAlign: 'left',

  },

  lineHeaderItemStacked: {

    flex: 1,

  },

  lineHeaderQty: {
    textAlign: 'center',

  },

  lineHeaderQtyStacked: {

    width: '100%',

    textAlign: 'left',

  },

  lineHeaderDays: {
    textAlign: 'center',

  },

  lineHeaderDaysStacked: {

    width: '100%',

    textAlign: 'left',

  },

  lineHeaderPrice: {
    textAlign: 'center',

  },

  lineHeaderPriceStacked: {

    width: '100%',

    textAlign: 'left',

  },

  lineHeaderTotal: {
    textAlign: 'center',

  },

  lineHeaderTotalStacked: {

    width: '100%',

    textAlign: 'left',

  },

  lineHeaderType: {
    textAlign: 'center',

  },

  lineHeaderTypeStacked: {

    width: '100%',

    textAlign: 'left',

  },

  lineHeaderAction: {
    textAlign: 'center',

  },
  lineColItem: {
    flex: 1.5,
  },
  lineColQty: {
    width: 72,
  },
  lineColDays: {
    width: 72,
  },
  lineColPrice: {
    width: 90,
  },
  lineColTotal: {
    width: 130,
  },
  lineColType: {
    width: 110,
  },
  lineColAction: {
    width: 80,
  },

  lineHeaderActionStacked: {

    width: '100%',

    textAlign: 'left',

  },

  lineRow: {

    flexDirection: 'row',

    alignItems: 'center',

    borderWidth: 1,

    borderColor: colors.border,

    borderRadius: 12,

    paddingHorizontal: 8,

    paddingVertical: 6,

    justifyContent: 'flex-start',

    gap: 8,

  },

  lineRowStacked: {

    flexDirection: 'column',

    alignItems: 'stretch',

  },
  lineFieldStack: {
    width: '100%',
    gap: 6,
  },
  lineFieldLabel: {
    fontFamily: FONT_HEADING,
    fontSize: 12,
    color: colors.warning,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  lineItemInput: {
    borderWidth: 1,

    borderColor: colors.border,

    borderRadius: 10,

    paddingHorizontal: 6,

    paddingVertical: 6,

    color: colors.text,

    backgroundColor: colors.surfaceAlt11,

    fontFamily: FONT_BODY,

    fontSize: 11,
    width: '100%',

  },

  lineItemInputStacked: {

    flex: 1,

    width: '100%',

  },

  linePriceInput: {
    width: '100%',

    borderWidth: 1,

    borderColor: colors.border,

    borderRadius: 10,

    paddingHorizontal: 6,

    paddingVertical: 6,

    color: colors.text,

    backgroundColor: colors.surfaceAlt11,

    fontFamily: FONT_BODY,

    fontSize: 11,

    textAlign: 'center',

  },

  linePriceInputStacked: {

    width: '100%',

    textAlign: 'left',

  },

  lineTypeInput: {
    width: '100%',

    borderWidth: 1,

    borderColor: colors.border,

    borderRadius: 10,

    paddingHorizontal: 6,

    paddingVertical: 6,

    color: colors.text,

    backgroundColor: colors.surfaceAlt11,

    fontFamily: FONT_BODY,

    fontSize: 11,

    textAlign: 'center',

  },

  lineTypeInputStacked: {

    width: '100%',

    textAlign: 'left',

  },

  lineTotal: {
    width: '100%',

    textAlign: 'center',

    fontFamily: FONT_HEADING,

    fontSize: 10,

    color: colors.warning,

    lineHeight: 12,

  },

  lineTotalStacked: {

    width: '100%',

    textAlign: 'left',

  },

  lineRemove: {
    width: '100%',

    borderWidth: 1,

    borderColor: colors.danger,

    borderRadius: 10,

    paddingVertical: 6,

    alignItems: 'center',

    backgroundColor: rgba.dangerSoft,

  },

  lineRemoveStacked: {

    width: '100%',

  },

  lineRemoveText: {

    fontFamily: FONT_HEADING,

    fontSize: 10,

    color: colors.dangerText,

  },

  stepper: {

    flexDirection: 'row',

    alignItems: 'center',

    borderWidth: 1,

    borderColor: colors.border,

    borderRadius: 10,

    backgroundColor: colors.surfaceAlt11,

    overflow: 'hidden',

  },

  stepperButton: {

    width: 28,

    height: 28,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: colors.surfaceAlt2,

  },

  stepperButtonText: {

    fontFamily: FONT_HEADING,

    fontSize: 12,

    color: colors.warning,

    lineHeight: 14,

  },

  stepperInput: {

    flex: 1,

    minWidth: 28,

    paddingVertical: 4,

    paddingHorizontal: 0,

    color: colors.text,

    fontFamily: FONT_BODY,

    fontSize: 11,

    textAlign: 'center',

  },

  ruleRow: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    borderWidth: 1,

    borderColor: colors.border,

    borderRadius: 12,

    paddingVertical: 8,

    paddingHorizontal: 10,

  },

  ruleName: {

    fontFamily: FONT_BODY,

    fontSize: 12,

    color: colors.text,

  },

  ruleControls: {

    flexDirection: 'row',

    gap: 8,

    alignItems: 'center',

  },

  ruleInput: {

    width: 64,

    borderWidth: 1,

    borderColor: colors.border,

    borderRadius: 10,

    paddingHorizontal: 6,

    paddingVertical: 4,

    color: colors.text,

    backgroundColor: colors.surfaceAlt11,

    fontFamily: FONT_BODY,

    fontSize: 11,

    textAlign: 'center',

  },

  ruleToggle: {

    borderWidth: 1,

    borderColor: colors.border,

    borderRadius: 10,

    paddingHorizontal: 8,

    paddingVertical: 4,

    backgroundColor: colors.surfaceAlt11,

  },

  ruleToggleActive: {

    borderColor: colors.warning,

  },

  ruleToggleText: {

    fontFamily: FONT_HEADING,

    fontSize: 10,

    color: colors.warning,

  },

  inventoryRow: {

    borderWidth: 1,

    borderColor: colors.border,

    borderRadius: 12,

    padding: 10,

    gap: 8,

  },

  inventoryGrid: {

    flexDirection: 'row',

    flexWrap: 'wrap',

    gap: 10,

  },

  inventoryCard: {

    borderWidth: 1,

    borderColor: colors.border,

    borderRadius: 12,

    padding: 10,

    gap: 8,

    flexGrow: 1,

    minWidth: 220,

  },

  inventoryTextStack: {

    flex: 1,

    gap: 2,

  },

  inventoryInfo: {

    flexDirection: 'row',

    gap: 10,

    alignItems: 'center',

  },

  inventoryIcon: {

    width: 34,

    height: 34,

  },

  inventoryName: {

    fontFamily: FONT_HEADING,

    fontSize: 11,

    color: colors.text,

  },

  inventoryCategory: {

    fontFamily: FONT_BODY,

    fontSize: 11,

    color: colors.textMuted,

  },

  inventoryBudgetTag: {

    fontFamily: FONT_HEADING,

    fontSize: 10,

    color: colors.info,

  },

  inventoryControls: {

    flexDirection: 'row',

    gap: 8,

    alignItems: 'center',

    justifyContent: 'flex-end',

  },

  inventoryControlsStacked: {

    flexDirection: 'column',

    alignItems: 'stretch',

    width: '100%',

  },

  inventoryQtyButton: {

    borderWidth: 1,

    borderColor: colors.border,

    borderRadius: 10,

    paddingHorizontal: 10,

    paddingVertical: 6,

    backgroundColor: colors.surfaceAlt11,

  },

  inventoryQtyButtonStacked: {

    width: '100%',

    alignItems: 'center',

  },

  inventoryQtyButtonDisabled: {

    opacity: 0.4,

  },

  inventoryQtyButtonText: {

    fontFamily: FONT_HEADING,

    fontSize: 12,

    color: colors.warning,

  },

  inventoryQtyValue: {

    minWidth: 28,

    textAlign: 'center',

    fontFamily: FONT_HEADING,

    fontSize: 12,

    color: colors.text,

  },

  inventoryAddLineButton: {

    borderWidth: 1,

    borderColor: colors.accent,

    borderRadius: 10,

    paddingHorizontal: 10,

    paddingVertical: 6,

    backgroundColor: colors.surfaceAlt2,

  },

  inventoryAddLineText: {

    fontFamily: FONT_HEADING,

    fontSize: 10,

    color: colors.accent,

  },

  inventoryRemoveLineButton: {

    borderWidth: 1,

    borderColor: colors.danger,

    borderRadius: 10,

    paddingHorizontal: 10,

    paddingVertical: 6,

    backgroundColor: rgba.dangerSoft,

  },

  inventoryRemoveLineText: {

    fontFamily: FONT_HEADING,

    fontSize: 10,

    color: colors.dangerText,

  },

  summaryRow: {

    flexDirection: 'row',

    justifyContent: 'space-between',

  },

  summaryLabel: {

    fontFamily: FONT_BODY,

    fontSize: 12,

    color: colors.textSubtle,

  },

  summaryValue: {

    fontFamily: FONT_BODY,

    fontSize: 12,

    color: colors.text,

  },

  summaryValueStrong: {

    fontFamily: FONT_HEADING,

    fontSize: 12,

    color: colors.accent,

  },

  });
};



export default BudgetModule;






























