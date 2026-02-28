import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Modal, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useProjectContext } from '../../context/ProjectContext';
import { useAppSettings } from '../../context/AppSettingsContext';
import { CAMERA_DEFAULTS, COLOR_DEFAULTS } from '../../utils/appUi';
import { computeShutterLabel } from '../../utils/exposureHelpers';
import NumericField from '../../components/NumericField';
import { ISO_SERIES_CINE, T_STOPS_CINE, FPS_SERIES } from '../../data/constants';

const DEFAULT_FLAGS = ['INT', 'EXT', 'DAY', 'NIGHT'];
const buildWeekdayLabels = (locale) =>
  locale === 'en' ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const BASE_FILTER_CATEGORIES = [
  {
    title: 'ND',
    chips: [
      { label: 'ND 1 stop', colorKey: 'link', color: '#60a5fa' },
      { label: 'ND 2 stops', colorKey: 'link', color: '#60a5fa' },
      { label: 'ND 3 stops', colorKey: 'link', color: '#60a5fa' },
      { label: 'ND 4 stops', colorKey: 'link', color: '#60a5fa' },
      { label: 'ND 5 stops', colorKey: 'link', color: '#60a5fa' },
      { label: 'ND 6 stops', colorKey: 'link', color: '#60a5fa' },
      { label: 'ND 7 stops', colorKey: 'link', color: '#60a5fa' },
      { label: 'ND 8 stops', colorKey: 'link', color: '#60a5fa' },
      { label: 'ND 10 stops', colorKey: 'link', color: '#60a5fa' },
    ],
  },
  {
    title: 'GND',
    chips: [
      { label: 'GND 1 stop', color: '#22d3ee' },
      { label: 'GND 2 stops', color: '#22d3ee' },
      { label: 'GND 3 stops', color: '#22d3ee' },
    ],
  },
  {
    title: 'Polarizer',
    titleKey: 'slate.filters.polarizer',
    chips: [
      { label: 'CPL', color: '#a78bfa' },
      { label: 'Linear Pola', color: '#a78bfa' },
    ],
  },
  {
    title: 'Diffusion',
    titleKey: 'slate.filters.diffusion',
    chips: [
      ...['1/8', '1/4', '1/2', '1', '2'].map((grade) => ({
        label: `Black Mist ${grade}`,
        color: '#f472b6',
      })),
      ...['1/8', '1/4', '1/2', '1', '2', '3', '4', '5'].map((grade) => ({
        label: `Glimmer ${grade}`,
        color: '#fbbf24',
      })),
      ...['1/8', '1/4', '1/2', '1', '2', '3', '4', '5'].map((grade) => ({
        label: `Soft FX ${grade}`,
        color: '#93c5fd',
      })),
      ...['1/8', '1/4', '1/2', '1', '2', '4', '5'].map((grade) => ({
        label: `Ultra Contrast ${grade}`,
        color: '#34d399',
      })),
    ],
  },
  {
    title: 'Correction',
    titleKey: 'slate.filters.correction',
    chips: [
      { label: '85', colorKey: 'warning', color: '#f59e0b' },
      { label: '85B', colorKey: 'warning', color: '#f59e0b' },
      { label: '80A', colorKey: 'link', color: '#60a5fa' },
      { label: '80B', colorKey: 'link', color: '#60a5fa' },
      { label: '81A', color: '#fcd34d' },
      { label: '81B', color: '#fcd34d' },
      { label: '82A', color: '#93c5fd' },
      { label: '82B', color: '#93c5fd' },
    ],
  },
  {
    title: 'Specials',
    titleKey: 'slate.filters.specials',
    chips: [
      { label: 'IR', colorKey: 'danger', color: '#f87171' },
      { label: 'Star 4pt', color: '#fbbf24' },
      { label: 'Star 6pt', color: '#fbbf24' },
      { label: 'Star 8pt', color: '#fbbf24' },
      { label: 'Streak', colorKey: 'link', color: '#60a5fa' },
      { label: 'Anamorphic Streak', colorKey: 'link', color: '#60a5fa' },
    ],
  },
  {
    title: 'Protection',
    titleKey: 'slate.filters.protection',
    chips: [
      { label: 'UV', colorKey: 'textMuted', color: '#94a3b8' },
      { label: 'Clear', colorKey: 'textMuted', color: '#94a3b8' },
    ],
  },
];

const FIELD_META = [
  { key: 'project', label: 'Project', labelKey: 'labels.project', accentKey: 'warning' },
  { key: 'scene', label: 'Scene', labelKey: 'labels.scene', accentKey: 'info' },
  { key: 'shot', label: 'Shot', labelKey: 'labels.shot', accentKey: 'accent' },
  { key: 'take', label: 'Take', accentKey: 'magenta' },
  { key: 'roll', label: 'Roll', accentKey: 'link' },
  { key: 'director', label: 'Director', accentKey: 'textSubtle' },
  { key: 'dop', label: 'DOP', accentKey: 'textSubtle' },
  { key: 'date', label: 'Date', labelKey: 'callSheet.date.label', accentKey: 'textSubtle' },
  { key: 'iso', label: 'ISO', accentKey: 'warning' },
  { key: 'wb', label: 'WB', accentKey: 'info' },
  { key: 'fps', label: 'FPS', accentKey: 'success' },
  { key: 'shutter', label: 'Shutter', accentKey: 'danger' },
  { key: 'lens', label: 'Lens', accentKey: 'link' },
  { key: 'tstop', label: 'T-stop', accentKey: 'success' },
];

const buildDefaultFields = ({ projectName, sceneName, shotName, camera, t }) => {
  const fps = camera?.fps ?? CAMERA_DEFAULTS.fps;
  const shutterAngle = camera?.shutterAngle ?? CAMERA_DEFAULTS.shutterAngle;
  return {
    project: projectName || t?.('labels.project', null, 'Project') || 'Project',
    scene: sceneName || t?.('labels.scene', null, 'Scene') || 'Scene',
    shot: shotName || t?.('labels.shot', null, 'Shot') || 'Shot',
    take: '1',
    clipName: '',
    timecodeIn: '',
    timecodeOut: '',
    mediaRoll: '',
    roll: '1',
    director: '',
    dop: '',
    date: new Date().toISOString().slice(0, 10),
    iso: camera?.iso ? String(camera.iso) : String(CAMERA_DEFAULTS.iso),
    wb: `${COLOR_DEFAULTS.cameraCCT}K`,
    fps: String(fps),
    shutter: computeShutterLabel({ shutterAngle, fps }),
    lens: '',
    tstop: camera?.tstop ? String(camera.tstop) : String(CAMERA_DEFAULTS.tstop),
    sound: 'SYNC',
    notes: '',
  };
};

const PixelSlateMockup = () => {
  const { currentProject, currentScene, currentShot, setShotModuleState } = useProjectContext();
  const { t, locale, theme } = useAppSettings();
  const colors = theme?.colors || {};
  const rgba = theme?.rgba || {};
  const translate = typeof t === 'function' ? t : (key, _params, fallback) => fallback || key;
  const [records, setRecords] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [fields, setFields] = useState({});
  const [flags, setFlags] = useState({});
  const [circleTake, setCircleTake] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [filterInput, setFilterInput] = useState('');
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [openFilterGroups, setOpenFilterGroups] = useState(() => ({}));
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [dateCursor, setDateCursor] = useState(new Date());
  const [saveFeedbackAt, setSaveFeedbackAt] = useState(0);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [syncOverrides, setSyncOverrides] = useState({});

  const lastPersistRef = useRef('');
  const hydratedRef = useRef(false);
  const saveTimerRef = useRef(null);

  const camera = currentShot?.modules?.camera || {};
  const colorModule = currentShot?.modules?.color || {};
  const projectName = currentProject?.name || '';
  const sceneName = currentScene?.name || '';
  const shotName = currentShot?.name || '';
  const windowWidth = Dimensions.get('window')?.width || 1024;
  const isThreeCol = windowWidth >= 1100;
  const isTwoCol = windowWidth >= 720 && windowWidth < 1100;
  const fieldBasis = isThreeCol ? '32%' : isTwoCol ? '48%' : '100%';
  const fieldMinWidth = isThreeCol ? 220 : isTwoCol ? 200 : 180;
  const localeTag = locale === 'en' ? 'en-US' : 'es-ES';
  const weekdayLabels = useMemo(() => buildWeekdayLabels(locale), [locale]);
  const filterCategories = useMemo(
    () =>
      BASE_FILTER_CATEGORIES.map((category) => ({
        ...category,
        title: category.titleKey ? translate(category.titleKey, null, category.title) : category.title,
        chips: (category.chips || []).map((chip) => ({
          ...chip,
          color: chip.colorKey ? colors?.[chip.colorKey] || chip.color : chip.color,
        })),
      })),
    [translate, colors],
  );
  const fieldMeta = useMemo(
    () =>
      FIELD_META.map((field) => ({
        ...field,
        label: field.labelKey ? translate(field.labelKey, null, field.label) : field.label,
        accent: colors?.[field.accentKey] || colors?.accent,
      })),
    [translate, colors],
  );
  const fieldMetaByKey = useMemo(
    () => Object.fromEntries(fieldMeta.map((item) => [item.key, item])),
    [fieldMeta],
  );
  const CORE_FIELDS = ['project', 'scene', 'shot', 'take', 'date'];
  const TECH_FIELDS = ['iso', 'tstop', 'fps', 'shutter'];
  const ADV_FIELDS = ['roll', 'wb', 'lens', 'director', 'dop'];
  const SYNC_FIELDS = ['iso', 'tstop', 'fps', 'shutter', 'wb'];
  const numericFieldSeries = {
    iso: ISO_SERIES_CINE,
    tstop: T_STOPS_CINE,
    fps: FPS_SERIES,
  };
  const numericStyles = useMemo(
    () => ({
      fieldRow: { gap: 6 },
      fieldLabel: { color: colors.textMuted, fontSize: 12 },
      numericControl: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: colors.surfaceAlt2,
      },
      numericControlDisabled: {
        borderColor: colors.borderDisabled,
        backgroundColor: colors.surfaceAlt11,
        opacity: 0.7,
      },
      numericButton: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRightWidth: 1,
        borderRightColor: colors.border,
      },
      numericButtonDisabled: { opacity: 0.5 },
      numericButtonText: { color: colors.warning, fontWeight: '700' },
      numericButtonTextDisabled: { color: colors.textMuted },
      numericInput: {
        flex: 1,
        paddingHorizontal: 8,
        paddingVertical: 6,
        color: colors.text,
        textAlign: 'center',
      },
      numericInputDisabled: { color: colors.textMuted },
      numericButtonSpacer: { width: 34, height: '100%' },
    }),
    [colors],
  );

  const ensureFlags = (stored = {}) => {
    const next = {};
    DEFAULT_FLAGS.forEach((flag) => {
      next[flag] = !!stored[flag];
    });
    return next;
  };

  const selectRecord = useCallback((record) => {
    if (!record) return;
    setActiveId(record.id);
    setFields(record.fields || {});
    setFlags(ensureFlags(record.flags));
    setSelectedTags(record.selectedTags || []);
    setSelectedFilters(record.filters || record.selectedFilters || []);
    setCircleTake(!!record.circleTake);
  }, []);

  useEffect(() => {
    if (!currentShot) return;
    hydratedRef.current = false;
    const stored = currentShot.modules?.slate?.records || [];
    const normalized = stored.map((record) => ({
      ...record,
      fields: record.fields || {},
      flags: ensureFlags(record.flags || {}),
      selectedTags: record.selectedTags || [],
      filters: record.filters || record.selectedFilters || [],
      circleTake: !!record.circleTake,
    }));
    setRecords(normalized);
    if (normalized.length) {
      selectRecord(normalized[0]);
    } else {
      const defaults = buildDefaultFields({ projectName, sceneName, shotName, camera, t: translate });
      setFields(defaults);
      setFlags(ensureFlags({}));
      setSelectedTags([]);
      setSelectedFilters([]);
      setCircleTake(false);
      setActiveId(null);
    }
    lastPersistRef.current = JSON.stringify(normalized);
    hydratedRef.current = true;
  }, [currentShot?.id]);

  useEffect(() => {
    if (!saveFeedbackAt) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setSaveFeedbackAt(0), 1600);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [saveFeedbackAt]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    const signature = JSON.stringify({ records, activeId });
    if (signature === lastPersistRef.current) return;
    lastPersistRef.current = signature;
    setShotModuleState('slate', {
      records,
      diffLabel,
      activeId,
      updatedAt: Date.now(),
    });
  }, [records, diffLabel, activeId, setShotModuleState]);

  const handleFieldChange = (key, value) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    if (SYNC_FIELDS.includes(key)) {
      setSyncOverrides((prev) => ({ ...prev, [key]: true }));
    }
  };

  const handleToggleFlag = (flag) => {
    setFlags((prev) => {
      const next = { ...prev, [flag]: !prev[flag] };
      if (activeId) {
        setRecords((recordsPrev) =>
          recordsPrev.map((record) =>
            record.id === activeId ? { ...record, flags: next, updatedAt: Date.now() } : record,
          ),
        );
      }
      return next;
    });
  };

  const handleAddTag = () => {
    const next = tagInput.trim();
    if (!next) return;
    if (selectedTags.includes(next)) {
      setTagInput('');
      return;
    }
    setSelectedTags((prev) => {
      const nextTags = [...prev, next];
      if (activeId) {
        setRecords((recordsPrev) =>
          recordsPrev.map((record) =>
            record.id === activeId ? { ...record, selectedTags: nextTags, updatedAt: Date.now() } : record,
          ),
        );
      }
      return nextTags;
    });
    setTagInput('');
  };

  const handleRemoveTag = (tag) => {
    setSelectedTags((prev) => {
      const nextTags = prev.filter((item) => item !== tag);
      if (activeId) {
        setRecords((recordsPrev) =>
          recordsPrev.map((record) =>
            record.id === activeId ? { ...record, selectedTags: nextTags, updatedAt: Date.now() } : record,
          ),
        );
      }
      return nextTags;
    });
  };

  const handleToggleFilter = (filterLabel) => {
    setSelectedFilters((prev) => {
      const nextFilters = prev.includes(filterLabel)
        ? prev.filter((item) => item !== filterLabel)
        : [...prev, filterLabel];
      if (activeId) {
        setRecords((recordsPrev) =>
          recordsPrev.map((record) =>
            record.id === activeId ? { ...record, filters: nextFilters, updatedAt: Date.now() } : record,
          ),
        );
      }
      return nextFilters;
    });
  };

  const handleAddFilter = () => {
    const next = filterInput.trim();
    if (!next) return;
    if (selectedFilters.includes(next)) {
      setFilterInput('');
      return;
    }
    setSelectedFilters((prev) => {
      const nextFilters = [...prev, next];
      if (activeId) {
        setRecords((recordsPrev) =>
          recordsPrev.map((record) =>
            record.id === activeId ? { ...record, filters: nextFilters, updatedAt: Date.now() } : record,
          ),
        );
      }
      return nextFilters;
    });
    setFilterInput('');
  };

  const handleRemoveFilter = (filterLabel) => {
    setSelectedFilters((prev) => {
      const nextFilters = prev.filter((item) => item !== filterLabel);
      if (activeId) {
        setRecords((recordsPrev) =>
          recordsPrev.map((record) =>
            record.id === activeId ? { ...record, filters: nextFilters, updatedAt: Date.now() } : record,
          ),
        );
      }
      return nextFilters;
    });
  };

  const toggleFilterGroup = (title) => {
    setOpenFilterGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const buildRecord = () => ({
    id: `slate-${Date.now()}`,
    fields,
    flags,
    selectedTags,
    filters: selectedFilters,
    circleTake,
    updatedAt: Date.now(),
  });

  const handleSaveRecord = () => {
    if (!fields?.project) return;
    if (activeId) {
      setRecords((prev) =>
        prev.map((record) =>
          record.id === activeId
            ? {
                ...record,
                fields,
                flags,
                selectedTags,
                filters: selectedFilters,
                circleTake,
                updatedAt: Date.now(),
              }
            : record,
        ),
      );
      setSaveFeedbackAt(Date.now());
      return;
    }
    const record = buildRecord();
    setRecords((prev) => [record, ...prev]);
    selectRecord(record);
    setSaveFeedbackAt(Date.now());
  };

  const handleNewRecord = () => {
    const defaults = buildDefaultFields({ projectName, sceneName, shotName, camera, t: translate });
    setFields(defaults);
    setFlags(ensureFlags({}));
    setSelectedTags([]);
    setSelectedFilters([]);
    setCircleTake(false);
    setActiveId(null);
  };

  const handleDeleteRecord = () => {
    if (!activeId) return;
    setRecords((prev) => prev.filter((record) => record.id !== activeId));
    setActiveId(null);
    const defaults = buildDefaultFields({ projectName, sceneName, shotName, camera, t: translate });
    setFields(defaults);
    setFlags(ensureFlags({}));
    setSelectedTags([]);
    setSelectedFilters([]);
    setCircleTake(false);
  };

  const recordList = useMemo(() => records, [records]);
  const activeRecord = useMemo(
    () => records.find((record) => record.id === activeId) || null,
    [records, activeId],
  );
  const cameraIso = Number.isFinite(camera?.iso) ? String(camera.iso) : '';
  const cameraTstop = Number.isFinite(camera?.tstop) ? String(camera.tstop) : '';
  const cameraFps = Number.isFinite(camera?.fps) ? String(camera.fps) : '';
  const cameraShutter = computeShutterLabel({
    shutterAngle: camera?.shutterAngle ?? 180,
    fps: camera?.fps ?? 24,
  });
  const cameraWb =
    colorModule?.cameraCCT ??
    colorModule?.cameraCct ??
    camera?.wb ??
    camera?.wbCCT ??
    camera?.cct ??
    '';
  const normalizeText = (value) => `${value ?? ''}`.trim().toUpperCase();
  const normalizeKelvin = (value) => {
    if (value === null || value === undefined) return null;
    const raw = `${value}`.replace(/[^0-9.]/g, '');
    const numeric = Number(raw);
    return Number.isFinite(numeric) ? numeric : null;
  };
  const compareNumeric = (a, b) => {
    const na = Number(a);
    const nb = Number(b);
    if (!Number.isFinite(na) || !Number.isFinite(nb)) return false;
    return Math.abs(na - nb) > 0.001;
  };
  const mismatchIso = cameraIso && fields?.iso ? compareNumeric(cameraIso, fields.iso) : false;
  const mismatchTstop = cameraTstop && fields?.tstop ? compareNumeric(cameraTstop, fields.tstop) : false;
  const mismatchFps = cameraFps && fields?.fps ? compareNumeric(cameraFps, fields.fps) : false;
  const mismatchShutter =
    cameraShutter && fields?.shutter ? normalizeText(cameraShutter) !== normalizeText(fields.shutter) : false;
  const cameraWbNum = normalizeKelvin(cameraWb);
  const fieldWbNum = normalizeKelvin(fields?.wb);
  const mismatchWb =
    cameraWbNum !== null && fieldWbNum !== null
      ? Math.abs(cameraWbNum - fieldWbNum) > 100
      : cameraWb && fields?.wb
        ? normalizeText(cameraWb) !== normalizeText(fields.wb)
        : false;
  const mismatchScene =
    sceneName && fields?.scene ? normalizeText(sceneName) !== normalizeText(fields.scene) : false;
  const mismatchShot =
    shotName && fields?.shot ? normalizeText(shotName) !== normalizeText(fields.shot) : false;
  const diffParts = [];
  if (mismatchIso) diffParts.push('ISO');
  if (mismatchTstop) diffParts.push('T');
  if (mismatchFps) diffParts.push('FPS');
  if (mismatchShutter) diffParts.push('Shutter');
  if (mismatchWb) diffParts.push('WB');
  if (mismatchScene) diffParts.push(translate('labels.scene', null, 'Scene'));
  if (mismatchShot) diffParts.push(translate('labels.shot', null, 'Shot'));
  const diffLabel = diffParts.length ? diffParts.join(' / ') : null;
  const mismatchByKey = {
    scene: mismatchScene,
    shot: mismatchShot,
    iso: mismatchIso,
    tstop: mismatchTstop,
    fps: mismatchFps,
    shutter: mismatchShutter,
    wb: mismatchWb,
  };

  const updateRecordField = (recordId, key, value) => {
    setRecords((prev) =>
      prev.map((record) =>
        record.id === recordId
          ? {
              ...record,
              fields: { ...(record.fields || {}), [key]: value },
              updatedAt: Date.now(),
            }
          : record,
      ),
    );
    if (recordId === activeId) {
      setFields((prev) => ({ ...prev, [key]: value }));
    }
  };

  const toggleRecordCircle = (recordId) => {
    setRecords((prev) =>
      prev.map((record) =>
        record.id === recordId
          ? { ...record, circleTake: !record.circleTake, updatedAt: Date.now() }
          : record,
      ),
    );
    if (recordId === activeId) {
      setCircleTake((prev) => !prev);
    }
  };

  const handleSyncFromCamera = () => {
    setFields((prev) => ({
      ...prev,
      iso: cameraIso || prev.iso,
      tstop: cameraTstop || prev.tstop,
      fps: camera?.fps ? String(camera.fps) : prev.fps,
      shutter: cameraShutter || prev.shutter,
      wb: cameraWb ? `${cameraWb}`.toString().includes('K') ? cameraWb : `${cameraWb}K` : prev.wb,
    }));
    setSyncOverrides((prev) => ({
      ...prev,
      iso: false,
      tstop: false,
      fps: false,
      shutter: false,
      wb: false,
    }));
  };

  useEffect(() => {
    if (!hydratedRef.current) return;
    setFields((prev) => {
      const next = { ...prev };
      if (!syncOverrides.iso && cameraIso) next.iso = cameraIso;
      if (!syncOverrides.tstop && cameraTstop) next.tstop = cameraTstop;
      if (!syncOverrides.fps && camera?.fps) next.fps = String(camera.fps);
      if (!syncOverrides.shutter && cameraShutter) next.shutter = cameraShutter;
      if (!syncOverrides.wb && cameraWb) {
        next.wb = `${cameraWb}`.toString().includes('K') ? cameraWb : `${cameraWb}K`;
      }
      return next;
    });
  }, [cameraIso, cameraTstop, cameraShutter, cameraWb, camera?.fps, syncOverrides]);

  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toISOString().slice(0, 10);
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

  const isSameDay = (a, b) =>
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const selectedDate = useMemo(() => {
    const value = fields?.date;
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [fields?.date]);

  const calendarMatrix = useMemo(() => buildMonthMatrix(dateCursor), [dateCursor]);

  const handleMonthChange = (direction) => {
    const next = new Date(dateCursor);
    next.setMonth(next.getMonth() + direction);
    setDateCursor(next);
  };

  const handleSelectCalendarDay = (day) => {
    if (!day?.date) return;
    const value = day.date.toISOString().slice(0, 10);
    handleFieldChange('date', value);
    setDatePickerVisible(false);
  };
  const savedAtLabel = useMemo(() => {
    if (!activeRecord?.updatedAt) return translate('slate.saved.none', null, 'Not saved');
    try {
      return new Date(activeRecord.updatedAt).toLocaleString(localeTag, {
        dateStyle: 'short',
        timeStyle: 'short',
      });
    } catch {
      return new Date(activeRecord.updatedAt).toISOString();
    }
  }, [activeRecord, localeTag, translate]);
  const advancedPreview = useMemo(
    () => translate('slate.advanced.preview', null, 'WB · Lente · Roll · Equipo'),
    [translate],
  );

  return (
    <View style={{ gap: 12 }}>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <TouchableOpacity
          onPress={handleSaveRecord}
          style={{
            borderWidth: 1,
            borderColor: colors.accent,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 8,
            backgroundColor: rgba.accentSoftAlt,
          }}
        >
          <Text style={{ color: colors.accent }}>
            {activeId
              ? translate('slate.action.update', null, 'Update')
              : translate('slate.action.save', null, 'Save')}
          </Text>
        </TouchableOpacity>
        {saveFeedbackAt ? (
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.success,
              backgroundColor: rgba.successSoftAlt,
            }}
          >
            <Text style={{ color: colors.success, fontSize: 12 }}>Actualizado</Text>
          </View>
        ) : null}
        <View
          style={{
            marginLeft: 'auto',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surfaceAlt,
          }}
        >
          <Text style={{ color: colors.textMuted }}>Guardado: {savedAtLabel}</Text>
        </View>
      </View>
      <View style={{ gap: 6 }}>
        <Text style={{ color: colors.accent, fontWeight: '700' }}>
          {translate('slate.title', null, 'Slate')}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 6,
            paddingVertical: 6,
            paddingHorizontal: 8,
            borderRadius: 12,
            backgroundColor: colors.surfaceAlt,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {[
            { key: 'scene', label: 'SCENE', color: colors.warning },
            { key: 'shot', label: 'SHOT', color: colors.accent },
            { key: 'take', label: 'TAKE', color: colors.magenta },
            { key: 'cam', label: 'CAM', color: colors.info },
            { key: 'date', label: 'DATE', color: colors.textSubtle },
            {
              key: 'iso',
              label: 'ISO',
              color: colors.warning,
              value: mismatchIso ? cameraIso : fields?.iso,
              mismatch: mismatchIso,
            },
            {
              key: 'tstop',
              label: 'TSTOP',
              color: colors.success,
              value: mismatchTstop ? cameraTstop : fields?.tstop,
              mismatch: mismatchTstop,
            },
            {
              key: 'shutter',
              label: 'SHUT',
              color: colors.danger,
              value: mismatchShutter ? cameraShutter : fields?.shutter,
              mismatch: mismatchShutter,
            },
            { key: 'lens', label: 'LENS', color: colors.link },
            {
              key: 'wb',
              label: 'WB',
              color: colors.link,
              value: mismatchWb ? cameraWb : fields?.wb,
              mismatch: mismatchWb,
            },
            { key: 'sound', label: 'SOUND', color: colors.textMuted },
          ].map((item) => (
            <View
              key={item.key}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 999,
                backgroundColor: item.mismatch ? rgba.dangerSoft : colors.surfaceAlt7,
                borderWidth: 1,
                borderColor: item.mismatch ? colors.danger : colors.borderMuted,
              }}
            >
              <Text style={{ color: item.mismatch ? colors.danger : item.color, fontWeight: '700' }}>
                {item.label}: {(item.value ?? fields?.[item.key]) || '-'}
              </Text>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 }}>
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.danger,
              backgroundColor: rgba.dangerSoft,
            }}
          >
            <Text style={{ color: colors.danger }}>
              {translate('slate.camera_diff.notice', null, 'Red = differs from camera module')}
            </Text>
          </View>
          <TouchableOpacity onPress={handleSyncFromCamera} style={{ paddingHorizontal: 10, paddingVertical: 6 }}>
            <Text style={{ color: colors.link }}>
              {translate('slate.camera_sync', null, 'Sync camera')}
            </Text>
          </TouchableOpacity>
        </View>
        <View
          style={{
            marginTop: 6,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.borderMuted,
            backgroundColor: colors.surfaceAlt2,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Text style={{ color: colors.textMuted }}>
            {translate('slate.history.hint', null, 'Historial de claquetas guardadas más abajo.')}
          </Text>
          <View style={{ marginLeft: 'auto' }}>
            <Text style={{ color: colors.link }}>{'↓'}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ paddingBottom: 8, flexGrow: 0 }} scrollEnabled={false}>
        <View style={{ gap: 12 }}>
          <View
            style={{
              padding: 10,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surfaceAlt,
              gap: 8,
            }}
          >
            <Text style={{ color: colors.text, fontWeight: '700' }}>
              {translate('slate.section.core', null, 'Toma')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {CORE_FIELDS.map((key) => {
                const meta = fieldMetaByKey[key];
                if (!meta) return null;
                return (
                  <View
                    key={key}
                    style={{
                      gap: 6,
                      marginBottom: 6,
                      flexBasis: fieldBasis,
                      flexGrow: 1,
                      minWidth: fieldMinWidth,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: meta.accent }} />
                      <Text style={{ color: mismatchByKey[key] ? colors.danger : colors.textMuted }}>{meta.label}</Text>
                      <View style={{ flex: 1, height: 1, backgroundColor: colors.borderMuted }} />
                    </View>
                    {key === 'date' ? (
                      <TouchableOpacity
                        onPress={() => setDatePickerVisible(true)}
                        style={{
                          borderWidth: 1,
                          borderColor: mismatchByKey[key] ? colors.danger : colors.border,
                          borderRadius: 10,
                          paddingHorizontal: 10,
                          paddingVertical: 8,
                          backgroundColor: mismatchByKey[key] ? rgba.dangerSoft : colors.surfaceAlt2,
                        }}
                      >
                        <Text style={{ color: colors.text }}>
                          {formatDate(fields?.date) || translate('slate.date.select', null, 'Select date')}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <TextInput
                        value={fields?.[key] ?? ''}
                        onChangeText={(value) => handleFieldChange(key, value)}
                        style={{
                          borderWidth: 1,
                          borderColor: mismatchByKey[key] ? colors.danger : colors.border,
                          borderRadius: 10,
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          color: colors.text,
                          backgroundColor: mismatchByKey[key] ? rgba.dangerSoft : colors.surfaceAlt2,
                        }}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          <View
            style={{
              padding: 10,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surfaceAlt,
              gap: 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>
                {translate('slate.section.tech', null, 'Técnico (sync cámara)')}
              </Text>
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={handleSyncFromCamera} style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
                <Text style={{ color: colors.link }}>{translate('slate.camera_sync', null, 'Sync camera')}</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: colors.textMuted }}>
              {translate(
                'slate.camera_sync.helper',
                null,
                'Se sincroniza con Camera setup. Puedes ajustar aquí si hace falta.',
              )}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {TECH_FIELDS.map((key) => {
                const meta = fieldMetaByKey[key];
                if (!meta) return null;
                const isNumeric = Boolean(numericFieldSeries[key]);
                return (
                  <View
                    key={key}
                    style={{
                      gap: 6,
                      marginBottom: 6,
                      flexBasis: fieldBasis,
                      flexGrow: 1,
                      minWidth: fieldMinWidth,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: meta.accent }} />
                      <Text style={{ color: mismatchByKey[key] ? colors.danger : colors.textMuted }}>{meta.label}</Text>
                      <View style={{ flex: 1, height: 1, backgroundColor: colors.borderMuted }} />
                    </View>
                    {isNumeric ? (
                      <NumericField
                        styles={numericStyles}
                        label=""
                        value={Number(fields?.[key] ?? 0)}
                        onChange={(value) => handleFieldChange(key, String(value))}
                        series={numericFieldSeries[key]}
                        precision={key === 'tstop' ? 2 : 0}
                        holdDelayMs={240}
                        holdIntervalMs={70}
                      />
                    ) : (
                      <TextInput
                        value={fields?.[key] ?? ''}
                        onChangeText={(value) => handleFieldChange(key, value)}
                        style={{
                          borderWidth: 1,
                          borderColor: mismatchByKey[key] ? colors.danger : colors.border,
                          borderRadius: 10,
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          color: colors.text,
                          backgroundColor: mismatchByKey[key] ? rgba.dangerSoft : colors.surfaceAlt2,
                        }}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setAdvancedOpen((prev) => !prev)}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 8,
              backgroundColor: colors.surfaceAlt2,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ gap: 2, flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>
                {advancedOpen
                  ? translate('slate.advanced.hide', null, 'Ocultar detalles')
                  : translate('slate.advanced.show', null, 'Detalles avanzados')}
              </Text>
              {!advancedOpen ? (
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                  {advancedPreview}
                </Text>
              ) : null}
            </View>
            <Text style={{ color: colors.accent }}>{advancedOpen ? '–' : '+'}</Text>
          </TouchableOpacity>

          {advancedOpen ? (
            <View
              style={{
                padding: 10,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surfaceAlt,
                gap: 8,
              }}
            >
              <Text style={{ color: colors.text, fontWeight: '700' }}>
                {translate('slate.section.advanced', null, 'Detalles')}
              </Text>
              <Text style={{ color: colors.textMuted }}>
                {translate(
                  'slate.section.advanced.subtitle',
                  null,
                  'WB, lente, roll y responsables de rodaje.',
                )}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {ADV_FIELDS.map((key) => {
                  const meta = fieldMetaByKey[key];
                  if (!meta) return null;
                  return (
                    <View
                      key={key}
                      style={{
                        gap: 6,
                        marginBottom: 6,
                        flexBasis: fieldBasis,
                        flexGrow: 1,
                        minWidth: fieldMinWidth,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: meta.accent }} />
                        <Text style={{ color: mismatchByKey[key] ? colors.danger : colors.textMuted }}>{meta.label}</Text>
                        <View style={{ flex: 1, height: 1, backgroundColor: colors.borderMuted }} />
                      </View>
                      <TextInput
                        value={fields?.[key] ?? ''}
                        onChangeText={(value) => handleFieldChange(key, value)}
                        style={{
                          borderWidth: 1,
                          borderColor: mismatchByKey[key] ? colors.danger : colors.border,
                          borderRadius: 10,
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          color: colors.text,
                          backgroundColor: mismatchByKey[key] ? rgba.dangerSoft : colors.surfaceAlt2,
                        }}
                      />
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}

          <View
            style={{
              gap: 6,
              marginBottom: 0,
              flexBasis: '100%',
              flexGrow: 0,
              minWidth: '100%',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: colors.textMuted }} />
              <Text style={{ color: colors.textMuted }}>Sound</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.borderMuted }} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {['SYNC', 'MOS'].map((option) => {
                const active = (fields?.sound || 'SYNC') === option;
                return (
                  <TouchableOpacity
                    key={option}
                    onPress={() => handleFieldChange('sound', option)}
                    style={{
                      borderWidth: 1,
                      borderColor: active ? colors.accent : colors.border,
                      borderRadius: 999,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      backgroundColor: active ? colors.accent : colors.surfaceAlt8,
                    }}
                  >
                    <Text style={{ color: active ? colors.textOnAccent : colors.textSubtle }}>{option}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        <View style={{ gap: 8 }}>
        <Text style={{ color: colors.textMuted }}>{translate('slate.filters.title', null, 'Filters')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {filterCategories.map((category) => {
            const accent = category.chips?.[0]?.color || colors.link;
            const hasSelected = category.chips.some((chip) => selectedFilters.includes(chip.label));
            const groupKey = category.titleKey || category.title;
            const isOpen = openFilterGroups[groupKey] ?? hasSelected;
            return (
              <View
                key={groupKey}
                style={{
                  gap: 6,
                  padding: 10,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceAlt,
                  flexBasis: fieldBasis,
                  flexGrow: 1,
                  minWidth: fieldMinWidth,
                }}
              >
                <TouchableOpacity
                  onPress={() => toggleFilterGroup(groupKey)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                >
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 3,
                      backgroundColor: accent,
                    }}
                  />
                  <Text style={{ color: colors.textSubtle, fontWeight: '700' }}>{category.title}</Text>
                  <View style={{ marginLeft: 'auto' }}>
                    <Text style={{ color: colors.textMuted }}>{isOpen ? '-' : '+'}</Text>
                  </View>
                </TouchableOpacity>
                {isOpen ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {category.chips.map((filter) => {
                      const active = selectedFilters.includes(filter.label);
                      return (
                        <TouchableOpacity
                          key={filter.label}
                          onPress={() => handleToggleFilter(filter.label)}
                          style={{
                            borderWidth: 1,
                            borderColor: active ? filter.color : colors.borderMuted,
                            borderRadius: 999,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            backgroundColor: active ? `${filter.color}22` : colors.surfaceAlt8,
                          }}
                        >
                          <Text style={{ color: active ? filter.color : colors.textSubtle, fontSize: 12 }}>
                            {active ? '✓ ' : ''}{filter.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={filterInput}
            onChangeText={setFilterInput}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 6,
              color: colors.text,
              backgroundColor: colors.surfaceAlt2,
            }}
            placeholder="agrega filtro"
            placeholderTextColor="#64748b"
          />
          <TouchableOpacity onPress={handleAddFilter} style={{ paddingHorizontal: 10, paddingVertical: 6 }}>
            <Text style={{ color: colors.link }}>{translate('slate.action.add', null, 'Add')}</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {selectedFilters.map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => handleRemoveFilter(filter)}
              style={{
                borderWidth: 1,
                borderColor: colors.accent,
                borderRadius: 999,
                paddingHorizontal: 8,
                paddingVertical: 4,
                backgroundColor: rgba.accentSoft,
              }}
            >
              <Text style={{ color: colors.accent, fontSize: 12 }}>{filter} ×</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      </ScrollView>

      <Modal transparent visible={datePickerVisible} animationType="fade" onRequestClose={() => setDatePickerVisible(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(4,10,24,0.7)', padding: 20 }} onPress={() => setDatePickerVisible(false)}>
          <Pressable
            style={{
              alignSelf: 'center',
              width: '100%',
              maxWidth: 360,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              padding: 12,
              gap: 8,
            }}
            onPress={(event) => event.stopPropagation()}
          >
            <Text style={{ color: colors.text, fontWeight: '700' }}>
              {translate('slate.date.modal_title', null, 'Select date')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <TouchableOpacity onPress={() => handleMonthChange(-1)} style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
                <Text style={{ color: colors.link }}>{'<'}</Text>
              </TouchableOpacity>
              <Text style={{ color: colors.text }}>
                {dateCursor.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={() => handleMonthChange(1)} style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
                <Text style={{ color: colors.link }}>{'>'}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {weekdayLabels.map((day) => (
                <Text key={day} style={{ color: colors.textMuted, width: 36, textAlign: 'center' }}>
                  {day}
                </Text>
              ))}
            </View>
            <View style={{ gap: 6 }}>
              {calendarMatrix.map((week, index) => (
                <View key={`week-${index}`} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  {week.map((day, dayIndex) => {
                    const isInMonth = day.inMonth;
                    const isSelected = selectedDate && isSameDay(day.date, selectedDate);
                    return (
                      <TouchableOpacity
                        key={`${index}-${dayIndex}`}
                        onPress={() => handleSelectCalendarDay(day)}
                        style={{
                          width: 36,
                          height: 32,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 8,
                          backgroundColor: isSelected ? colors.accent : 'transparent',
                          opacity: isInMonth ? 1 : 0.35,
                          borderWidth: 1,
                          borderColor: isSelected ? colors.accent : 'transparent',
                        }}
                      >
                        <Text style={{ color: isSelected ? colors.textOnAccent : colors.text }}>
                          {day.date.getDate()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <View
        style={{
          gap: 6,
          padding: 10,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surfaceAlt,
        }}
      >
        <Text style={{ color: colors.textSubtle, fontWeight: '700' }}>Flags</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {DEFAULT_FLAGS.map((flag) => (
            <TouchableOpacity
              key={flag}
              onPress={() => handleToggleFlag(flag)}
              style={{
                borderWidth: 1,
                borderColor: flags[flag] ? colors.accent : colors.borderMuted,
                borderRadius: 999,
                paddingHorizontal: 8,
                paddingVertical: 4,
                backgroundColor: flags[flag] ? colors.accent : colors.surfaceAlt8,
              }}
            >
              <Text style={{ color: flags[flag] ? colors.textOnAccent : colors.textSubtle, fontSize: 12 }}>
                {flag}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => setCircleTake((prev) => !prev)}
            style={{
              borderWidth: 1,
              borderColor: circleTake ? colors.accent : colors.borderMuted,
              borderRadius: 999,
              paddingHorizontal: 8,
              paddingVertical: 4,
              backgroundColor: circleTake ? colors.accent : colors.surfaceAlt8,
            }}
          >
            <Text style={{ color: circleTake ? colors.textOnAccent : colors.textSubtle, fontSize: 12 }}>
              Circle Take
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <View
          style={{
            gap: 6,
            padding: 10,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surfaceAlt,
          }}
        >
          <Text style={{ color: colors.textSubtle, fontWeight: '700' }}>Tags</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              value={tagInput}
              onChangeText={setTagInput}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                paddingHorizontal: 10,
                paddingVertical: 6,
                color: colors.text,
                backgroundColor: colors.surfaceAlt2,
              }}
              placeholder="agrega tag"
              placeholderTextColor="#64748b"
            />
            <TouchableOpacity onPress={handleAddTag} style={{ paddingHorizontal: 10, paddingVertical: 6 }}>
              <Text style={{ color: colors.link }}>{translate('slate.action.add', null, 'Add')}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {selectedTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                onPress={() => handleRemoveTag(tag)}
                style={{
                  borderWidth: 1,
                  borderColor: colors.borderMuted,
                  borderRadius: 999,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  backgroundColor: colors.surfaceAlt8,
                }}
              >
                <Text style={{ color: colors.textSubtle, fontSize: 12 }}>{tag} x</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View
        style={{
          gap: 10,
          paddingTop: 8,
          paddingHorizontal: 10,
          paddingBottom: 10,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.surfaceAlt11,
          ...(Platform.OS === 'web'
            ? { position: 'sticky', bottom: 0, zIndex: 10 }
            : {}),
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ color: colors.textMuted }}>Historial</Text>
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surfaceAlt,
            }}
          >
            <Text style={{ color: colors.textSubtle }}>{recordList.length}</Text>
          </View>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={handleNewRecord} style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text style={{ color: colors.link }}>+ Nuevo</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 2, paddingRight: 8 }}
        >
          {recordList.length === 0 ? (
            <Text style={{ color: colors.textMuted }}>
              {translate('slate.history.empty', null, 'Sin registros todavía.')}
            </Text>
          ) : null}
          {recordList.map((record) => (
            <TouchableOpacity
              key={record.id}
              onPress={() => selectRecord(record)}
              style={{
                borderWidth: 1,
                borderColor: record.id === activeId ? colors.accent : colors.border,
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 6,
                backgroundColor: record.id === activeId ? colors.accent : colors.surfaceAlt8,
                maxWidth: 220,
              }}
            >
              <Text
                style={{ color: record.id === activeId ? colors.textOnAccent : colors.textSubtle }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {record.fields?.scene || translate('labels.scene', null, 'Scene')}{' '}
                {record.fields?.shot || ''}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <TouchableOpacity onPress={handleDeleteRecord} style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
            <View
              style={{
                borderWidth: 1,
                borderColor: colors.danger,
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 4,
                backgroundColor: rgba.dangerSoft,
              }}
            >
              <Text style={{ color: colors.danger }}>{translate('slate.action.delete', null, 'Delete')}</Text>
            </View>
          </TouchableOpacity>
          <Text style={{ color: colors.textMuted, marginLeft: 'auto' }}>Guardado: {savedAtLabel}</Text>
        </View>
      </View>

      <View style={{ gap: 10, marginTop: 14 }}>
        <Text style={{ color: colors.text, fontWeight: '700' }}>
          {translate('slate.report.title', null, 'Camera report')}
        </Text>
        <Text style={{ color: colors.textMuted }}>
          {recordList.length
            ? translate('slate.report.helper', null, 'Listado de takes por escena y plano.')
            : translate('slate.report.empty', null, 'Sin registros para reportar.')}
        </Text>
        <View style={{ gap: 8 }}>
          {recordList.map((record, index) => {
            const takeLabel = record.fields?.take || `${index + 1}`;
            return (
              <View
                key={`report-${record.id}`}
                style={{
                  borderWidth: 1,
                  borderColor: record.id === activeId ? colors.accent : colors.border,
                  borderRadius: 12,
                  padding: 10,
                  backgroundColor: colors.surfaceAlt2,
                  gap: 6,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.surfaceAlt,
                    }}
                  >
                    <Text style={{ color: colors.textSubtle }}>Take {takeLabel}</Text>
                  </View>
                  {Array.isArray(record.filters) && record.filters.length ? (
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: colors.accent,
                        backgroundColor: rgba.accentSoft,
                      }}
                    >
                      <Text style={{ color: colors.accent, fontSize: 12 }}>
                        {translate('slate.filters.count', { n: record.filters.length }, 'Filters: {n}')}
                      </Text>
                    </View>
                  ) : null}
                  <TouchableOpacity onPress={() => selectRecord(record)} style={{ paddingHorizontal: 6, paddingVertical: 4 }}>
                    <Text style={{ color: colors.link }}>Ver claqueta</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => toggleRecordCircle(record.id)} style={{ paddingHorizontal: 6, paddingVertical: 4 }}>
                    <Text style={{ color: record.circleTake ? colors.accent : colors.textMuted }}>
                      {record.circleTake ? 'Circled' : 'Circle'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <TextInput
                    value={record.fields?.clipName || ''}
                    onChangeText={(value) => updateRecordField(record.id, 'clipName', value)}
                    style={{
                      flexGrow: 1,
                      minWidth: 120,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 10,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      color: colors.text,
                      backgroundColor: colors.surfaceAlt,
                    }}
                    placeholder="Clip"
                    placeholderTextColor="#64748b"
                  />
                  <TextInput
                    value={record.fields?.timecodeIn || ''}
                    onChangeText={(value) => updateRecordField(record.id, 'timecodeIn', value)}
                    style={{
                      minWidth: 110,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 10,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      color: colors.text,
                      backgroundColor: colors.surfaceAlt,
                    }}
                    placeholder="TC In"
                    placeholderTextColor="#64748b"
                  />
                  <TextInput
                    value={record.fields?.timecodeOut || ''}
                    onChangeText={(value) => updateRecordField(record.id, 'timecodeOut', value)}
                    style={{
                      minWidth: 110,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 10,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      color: colors.text,
                      backgroundColor: colors.surfaceAlt,
                    }}
                    placeholder="TC Out"
                    placeholderTextColor="#64748b"
                  />
                  <TextInput
                    value={record.fields?.mediaRoll || ''}
                    onChangeText={(value) => updateRecordField(record.id, 'mediaRoll', value)}
                    style={{
                      minWidth: 110,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 10,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      color: colors.text,
                      backgroundColor: colors.surfaceAlt,
                    }}
                    placeholder="Media / Roll"
                    placeholderTextColor="#64748b"
                  />
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {(record.filters || []).map((filter) => (
                    <View
                      key={`${record.id}-${filter}`}
                      style={{
                        borderWidth: 1,
                        borderColor: colors.accent,
                        borderRadius: 999,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        backgroundColor: rgba.accentSoft,
                      }}
                    >
                      <Text style={{ color: colors.accent, fontSize: 12 }}>{filter}</Text>
                    </View>
                  ))}
                  {(record.selectedTags || []).map((tag) => (
                    <View
                      key={`${record.id}-tag-${tag}`}
                      style={{
                        borderWidth: 1,
                        borderColor: colors.link,
                        borderRadius: 999,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        backgroundColor: 'rgba(56,189,248,0.18)',
                      }}
                    >
                      <Text style={{ color: colors.link, fontSize: 12 }}>{tag}</Text>
                    </View>
                  ))}
                </View>
                <TextInput
                  value={record.fields?.notes || ''}
                  onChangeText={(value) => updateRecordField(record.id, 'notes', value)}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 10,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    color: colors.text,
                    backgroundColor: colors.surfaceAlt,
                  }}
                  placeholder={translate('slate.notes.placeholder', null, 'Notes')}
                  placeholderTextColor="#64748b"
                />
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

export default PixelSlateMockup;
