import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useProjectContext } from '../context/ProjectContext';
import { useAppSettings } from '../context/AppSettingsContext';
import { getActiveCallSheetFromProject } from '../utils/callSheet';
import { createInitialSunSeekerState, getSunPosition, getSunTimes, shiftToLocalTime } from '../utils/sunSeeker';
import {
  clampMinutes,
  formatTimeWithZone,
  getApproxOffsetMinutesFromLon,
  getMinutesInTimeZone,
  getTimeZoneOffsetMinutes,
  parseDateUtc,
  resolveTimeZone,
} from '../utils/timezone';
import { COUNTRY_OPTIONS, getCitiesForCountry, findOfflineCity } from '../data/cities';
import { geocodeCity } from '../services/geocode';
import LabeledPicker from '../components/LabeledPicker';

const PLACEHOLDER_COLOR = '#64748b';

const SunSeekerModule = ({ styles, canEdit = true, canExport = true, onExport }) => {
  const { currentProject, setProjectSunSeekerState } = useProjectContext();
  const { t, locale, theme } = useAppSettings();
  const sunSeekerState = currentProject?.sunSeeker;
  const localStyles = useMemo(() => buildLocalStyles(theme), [theme]);
  const activeCallSheet = getActiveCallSheetFromProject(currentProject);
  const dayNumber = activeCallSheet?.dayNumber || 1;
  const dayKey = String(dayNumber);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [dateCursor, setDateCursor] = useState(new Date());
  const [latInput, setLatInput] = useState('');
  const [lonInput, setLonInput] = useState('');
  const [countryValue, setCountryValue] = useState('');
  const [timeMinutes, setTimeMinutes] = useState(null);
  const [status, setStatus] = useState('');
  const locationAttempted = useRef(false);
  const holdTimeoutRef = useRef(null);
  const holdIntervalRef = useRef(null);
  const holdDelayMs = 240;
  const holdIntervalMs = 70;
  const longPressActiveRef = useRef(false);
  const tapStepMinutes = 15;
  const holdStepMinutes = 15;
  const timeMinutesRef = useRef(timeMinutes);
  const rangeStartRef = useRef(null);

  useEffect(() => {
    timeMinutesRef.current = timeMinutes;
  }, [timeMinutes]);

  useEffect(() => {
    if (!sunSeekerState && setProjectSunSeekerState) {
      setProjectSunSeekerState(() => createInitialSunSeekerState());
    }
  }, [sunSeekerState, setProjectSunSeekerState]);

  const configs = sunSeekerState?.configs || [];
  const activeConfigId = sunSeekerState?.activeConfigId || '';
  const dayEntry = sunSeekerState?.days?.[dayKey] || {};
  const activeConfig = configs.find((item) => item.id === activeConfigId) || null;
  const selectedDate = activeConfig?.date || dayEntry?.date || activeCallSheet?.date || '';
  const cityOptions = useMemo(
    () => getCitiesForCountry(countryValue || dayEntry?.country),
    [countryValue, dayEntry?.country],
  );

  useEffect(() => {
    if (!selectedDate && setProjectSunSeekerState) {
      const today = new Date();
      const iso = today.toISOString().slice(0, 10);
      setProjectSunSeekerState((prev) => ({
        ...(prev || createInitialSunSeekerState()),
        days: {
          ...(prev?.days || {}),
          [dayKey]: {
            ...(prev?.days?.[dayKey] || {}),
            dayNumber,
            date: iso,
            updatedAt: Date.now(),
          },
        },
        updatedAt: Date.now(),
      }));
    }
  }, [selectedDate, dayKey, dayNumber, setProjectSunSeekerState]);

  const updateDayEntry = useCallback(
    (patch) => {
      if (!setProjectSunSeekerState || !canEdit) return;
      setProjectSunSeekerState((prev) => ({
        ...(prev || createInitialSunSeekerState()),
        days: {
          ...(prev?.days || {}),
          [dayKey]: {
            ...(prev?.days?.[dayKey] || {}),
            dayNumber,
            ...patch,
            updatedAt: Date.now(),
          },
        },
        configs: (prev?.configs || []).map((cfg) =>
          cfg.id === activeConfigId
            ? {
                ...cfg,
                ...patch,
                updatedAt: Date.now(),
              }
            : cfg,
        ),
        updatedAt: Date.now(),
      }));
    },
    [setProjectSunSeekerState, canEdit, dayKey, dayNumber, activeConfigId],
  );

  useEffect(() => {
    if (activeConfig?.lat != null) setLatInput(String(activeConfig.lat));
    else if (dayEntry?.lat != null) setLatInput(String(dayEntry.lat));
    if (activeConfig?.lon != null) setLonInput(String(activeConfig.lon));
    else if (dayEntry?.lon != null) setLonInput(String(dayEntry.lon));
    setCountryValue(activeConfig?.country || dayEntry?.country || '');
  }, [activeConfig?.lat, activeConfig?.lon, activeConfig?.country, dayEntry?.lat, dayEntry?.lon, dayEntry?.country]);

  useEffect(() => {
    if (!activeConfig || !canEdit) return;
    updateDayEntry({
      date: activeConfig.date || selectedDate,
      city: activeConfig.city || '',
      country: activeConfig.country || '',
      timeZone: activeConfig.timeZone || null,
      lat: activeConfig.lat ?? null,
      lon: activeConfig.lon ?? null,
      source: activeConfig.source || 'manual',
    });
  }, [activeConfigId]);

  const updateCountry = useCallback(
    (value) => {
      setCountryValue(value);
      updateDayEntry({
        country: value,
        city: '',
        lat: null,
        lon: null,
        source: 'manual',
      });
      setLatInput('');
      setLonInput('');
    },
    [updateDayEntry],
  );

  const updateCity = useCallback(
    (value) => {
      updateDayEntry({ city: value });
      const match = cityOptions.find((item) => item.value === value);
      if (match) {
        updateDayEntry({
          lat: match.lat,
          lon: match.lon,
          timeZone: match.timeZone || null,
          source: 'offline',
        });
        setLatInput(String(match.lat));
        setLonInput(String(match.lon));
        setStatus(t('sunSeeker.status.offline'));
      }
    },
    [updateDayEntry, cityOptions],
  );

  const configOptions = useMemo(() => {
    if (!configs.length) return [{ value: '', label: t('sunSeeker.saved.empty') }];
    const ordered = [...configs].sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.localeCompare(b.date);
    });
    return ordered.map((cfg, index) => {
      const labelCity = cfg.city || cfg.country || t('sunSeeker.saved.city_fallback');
      const labelDate = cfg.date || t('sunSeeker.saved.date_fallback');
      return {
        value: cfg.id,
        label: t(
          'sunSeeker.saved.entry',
          { n: index + 1, city: labelCity, date: labelDate },
          `Window ${index + 1} · ${labelCity} · ${labelDate}`,
        ),
      };
    });
  }, [configs, t]);

  const handleSelectConfig = useCallback(
    (value) => {
      if (!setProjectSunSeekerState) return;
      setProjectSunSeekerState((prev) => ({
        ...(prev || createInitialSunSeekerState()),
        activeConfigId: value,
        updatedAt: Date.now(),
      }));
    },
    [setProjectSunSeekerState],
  );

  const handleSaveConfig = useCallback(() => {
    if (!setProjectSunSeekerState || !canEdit) return;
    const id = `cfg-${Date.now()}`;
    const payload = {
      id,
      date: selectedDate || '',
      city: dayEntry?.city || '',
      country: dayEntry?.country || '',
      timeZone: dayEntry?.timeZone || '',
      lat: Number.isFinite(Number(dayEntry?.lat)) ? Number(dayEntry.lat) : null,
      lon: Number.isFinite(Number(dayEntry?.lon)) ? Number(dayEntry.lon) : null,
      source: dayEntry?.source || 'manual',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setProjectSunSeekerState((prev) => ({
      ...(prev || createInitialSunSeekerState()),
      configs: [...(prev?.configs || []), payload],
      activeConfigId: id,
      updatedAt: Date.now(),
    }));
  }, [setProjectSunSeekerState, canEdit, selectedDate, dayEntry?.city, dayEntry?.country, dayEntry?.timeZone, dayEntry?.lat, dayEntry?.lon, dayEntry?.source]);

  const handleDeleteConfig = useCallback(() => {
    if (!setProjectSunSeekerState || !canEdit || !activeConfigId) return;
    setProjectSunSeekerState((prev) => {
      const nextConfigs = (prev?.configs || []).filter((cfg) => cfg.id !== activeConfigId);
      const nextActive = nextConfigs[0]?.id || '';
      return {
        ...(prev || createInitialSunSeekerState()),
        configs: nextConfigs,
        activeConfigId: nextActive,
        updatedAt: Date.now(),
      };
    });
  }, [setProjectSunSeekerState, canEdit, activeConfigId]);

  const requestDeviceLocation = useCallback(async () => {
    if (!canEdit) return;
    setStatus(t('sunSeeker.status.locating'));
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos),
            (err) => reject(err),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
          );
        }).then((pos) => {
          const coords = pos.coords || {};
          const tz =
            typeof Intl !== 'undefined' &&
            Intl.DateTimeFormat &&
            Intl.DateTimeFormat().resolvedOptions
              ? Intl.DateTimeFormat().resolvedOptions().timeZone
              : null;
          const resolved = tz || resolveTimeZone(coords.latitude, coords.longitude);
          updateDayEntry({
            lat: coords.latitude,
            lon: coords.longitude,
            timeZone: resolved || null,
            source: 'gps',
          });
          setLatInput(String(coords.latitude));
          setLonInput(String(coords.longitude));
        });
        setStatus(t('sunSeeker.status.updated'));
        return;
      }
      let Location;
      try {
        Location = require('expo-location');
      } catch (error) {
        Location = null;
      }
      if (!Location?.requestForegroundPermissionsAsync) {
        setStatus(t('sunSeeker.status.permission_unavailable'));
        return;
      }
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        setStatus(t('sunSeeker.status.permission_denied'));
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      const coords = position?.coords || {};
      updateDayEntry({
        lat: coords.latitude,
        lon: coords.longitude,
        timeZone:
          typeof Intl !== 'undefined' &&
          Intl.DateTimeFormat &&
          Intl.DateTimeFormat().resolvedOptions
            ? Intl.DateTimeFormat().resolvedOptions().timeZone
            : resolveTimeZone(coords.latitude, coords.longitude),
        source: 'gps',
      });
      setLatInput(String(coords.latitude));
      setLonInput(String(coords.longitude));
      setStatus(t('sunSeeker.status.updated'));
    } catch (error) {
      setStatus(t('sunSeeker.status.gps_error'));
    }
  }, [canEdit, updateDayEntry, t]);

  const handleGeocodeCity = useCallback(async () => {
    if (!canEdit) return;
    setStatus(t('sunSeeker.status.search_city'));
    const cacheKey = `${(dayEntry?.country || '').trim().toLowerCase()}|${(dayEntry?.city || '')
      .trim()
      .toLowerCase()}`;
    const cached = sunSeekerState?.geocodeCache?.[cacheKey];
    if (cached && Number.isFinite(cached.lat) && Number.isFinite(cached.lon)) {
      updateDayEntry({
        lat: cached.lat,
        lon: cached.lon,
        timeZone: cached.timeZone || null,
        source: 'cache',
      });
      setLatInput(String(cached.lat));
      setLonInput(String(cached.lon));
      setStatus(t('sunSeeker.status.cached'));
      return;
    }
    const offline = findOfflineCity(dayEntry?.country, dayEntry?.city);
    if (offline) {
      updateDayEntry({
        city: offline.city,
        country: offline.country,
        lat: offline.lat,
        lon: offline.lon,
        timeZone: offline.timeZone || null,
        source: 'offline',
      });
      setLatInput(String(offline.lat));
      setLonInput(String(offline.lon));
      setStatus(t('sunSeeker.status.offline'));
      if (setProjectSunSeekerState) {
        setProjectSunSeekerState((prev) => ({
          ...(prev || createInitialSunSeekerState()),
          geocodeCache: {
            ...(prev?.geocodeCache || {}),
            [`${offline.country.trim().toLowerCase()}|${offline.city.trim().toLowerCase()}`]: {
              lat: offline.lat,
              lon: offline.lon,
              timeZone: offline.timeZone || null,
            },
          },
          updatedAt: Date.now(),
        }));
      }
      return;
    }
    const result = await geocodeCity({ city: dayEntry?.city, country: dayEntry?.country });
    if (!result) {
      setStatus(t('sunSeeker.status.city_not_found'));
      return;
    }
    const resolved = resolveTimeZone(result.lat, result.lon);
    updateDayEntry({
      lat: result.lat,
      lon: result.lon,
      timeZone: resolved || null,
      source: 'manual',
    });
    setLatInput(String(result.lat));
    setLonInput(String(result.lon));
    setStatus(t('sunSeeker.status.updated'));
    if (setProjectSunSeekerState && cacheKey) {
      setProjectSunSeekerState((prev) => ({
        ...(prev || createInitialSunSeekerState()),
        geocodeCache: {
          ...(prev?.geocodeCache || {}),
          [cacheKey]: { lat: result.lat, lon: result.lon, timeZone: resolved || null },
        },
        updatedAt: Date.now(),
      }));
    }
  }, [canEdit, dayEntry?.city, dayEntry?.country, sunSeekerState?.geocodeCache, setProjectSunSeekerState, updateDayEntry, t]);

  useEffect(() => {
    if (locationAttempted.current) return;
    if (dayEntry?.lat != null && dayEntry?.lon != null) return;
    locationAttempted.current = true;
    requestDeviceLocation();
  }, [dayEntry?.lat, dayEntry?.lon, requestDeviceLocation]);

  const parsedDate = useMemo(() => {
    if (selectedDate) {
      const utc = parseDateUtc(selectedDate);
      if (utc && !Number.isNaN(utc.getTime())) return utc;
    }
    return new Date();
  }, [selectedDate]);

  const dateForPosition = useMemo(() => {
    const future = new Date(parsedDate);
    const minutes = Number.isFinite(Number(timeMinutes)) ? Number(timeMinutes) : null;
    const lon = Number(dayEntry?.lon);
    const tzOffset =
      dayEntry?.timeZone
        ? getTimeZoneOffsetMinutes(parsedDate, dayEntry.timeZone)
        : getApproxOffsetMinutesFromLon(lon);
    const offsetMinutes = Number.isFinite(tzOffset) ? tzOffset : 0;
    const now = new Date();
    const fallbackMinutes = dayEntry?.timeZone
      ? getMinutesInTimeZone(now, dayEntry.timeZone)
      : clampMinutes(now.getUTCHours() * 60 + now.getUTCMinutes() + offsetMinutes);
    const localMinutes = minutes == null ? fallbackMinutes : clampMinutes(minutes);
    const utcMinutes = localMinutes - offsetMinutes;
    future.setUTCHours(0, 0, 0, 0);
    future.setUTCMinutes(utcMinutes);
    return future;
  }, [parsedDate, timeMinutes, dayEntry?.timeZone, dayEntry?.lon]);

  const locationReady = Number.isFinite(Number(dayEntry?.lat)) && Number.isFinite(Number(dayEntry?.lon));
  const sourceLabel =
    dayEntry?.source === 'cache'
      ? t('sunSeeker.source.cache')
      : dayEntry?.source === 'offline'
        ? t('sunSeeker.source.offline')
        : dayEntry?.source === 'manual'
          ? t('sunSeeker.source.manual')
          : t('sunSeeker.source.gps_ready');
  const gpsBadge = locationReady ? sourceLabel : t('sunSeeker.badge.no_location');
  const gpsTone = locationReady ? 'success' : 'warn';
  const showApprox = locationReady && !dayEntry?.timeZone;

  const computed = useMemo(() => {
    if (!locationReady) return null;
    const lat = Number(dayEntry.lat);
    const lon = Number(dayEntry.lon);
    const times = getSunTimes(parsedDate, lat, lon);
    const localTimes = dayEntry?.timeZone
      ? times
      : {
          solarNoon: shiftToLocalTime(times.solarNoon, lon),
          sunrise: shiftToLocalTime(times.sunrise, lon),
          sunset: shiftToLocalTime(times.sunset, lon),
          dawn: shiftToLocalTime(times.dawn, lon),
          dusk: shiftToLocalTime(times.dusk, lon),
          blueHourStart: shiftToLocalTime(times.blueHourStart, lon),
          blueHourEnd: shiftToLocalTime(times.blueHourEnd, lon),
          goldenHourStart: shiftToLocalTime(times.goldenHourStart, lon),
          goldenHourEnd: shiftToLocalTime(times.goldenHourEnd, lon),
        };
    return {
      position: getSunPosition(dateForPosition, lat, lon),
      times: localTimes,
    };
  }, [locationReady, dayEntry?.lat, dayEntry?.lon, dayEntry?.timeZone, dateForPosition, parsedDate]);

  const minutesFromDate = useCallback(
    (value) => {
      if (!value) return null;
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return null;
      if (dayEntry?.timeZone) {
        const minutes = getMinutesInTimeZone(d, dayEntry.timeZone);
        if (Number.isFinite(minutes)) return minutes;
      }
      return d.getUTCHours() * 60 + d.getUTCMinutes();
    },
    [dayEntry?.timeZone],
  );

  const rangeStart = useMemo(() => (computed ? minutesFromDate(computed.times.dawn) : null), [computed, minutesFromDate]);
  const rangeEnd = useMemo(() => (computed ? minutesFromDate(computed.times.dusk) : null), [computed, minutesFromDate]);

  useEffect(() => {
    rangeStartRef.current = rangeStart;
  }, [rangeStart]);

  useEffect(() => {
    const stored = Number.isFinite(Number(dayEntry?.timeMinutes)) ? Number(dayEntry.timeMinutes) : null;
    if (stored != null) {
      setTimeMinutes(stored);
      return;
    }
    if (rangeStart != null) {
      setTimeMinutes(rangeStart);
      updateDayEntry({ timeMinutes: rangeStart });
    }
  }, [dayEntry?.timeMinutes, rangeStart]);

  useEffect(() => {
    if (rangeStart == null) return;
    if (timeMinutes == null) {
      setTimeMinutes(rangeStart);
      updateDayEntry({ timeMinutes: rangeStart });
      return;
    }
    if (rangeEnd != null && (timeMinutes < rangeStart || timeMinutes > rangeEnd)) {
      const clamped = clampToRange(timeMinutes);
      setTimeMinutes(clamped);
      updateDayEntry({ timeMinutes: clamped });
    }
  }, [rangeStart, rangeEnd, timeMinutes, clampToRange, updateDayEntry]);

  const formatMinutes = useCallback((value) => {
    if (!Number.isFinite(Number(value))) return '--:--';
    const total = Number(value);
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }, []);

  const clampToRange = useCallback(
    (value) => {
      if (rangeStart == null || rangeEnd == null) return Math.min(1439, Math.max(0, value));
      return Math.min(rangeEnd, Math.max(rangeStart, value));
    },
    [rangeStart, rangeEnd],
  );

  const stepMinutes = useCallback(
    (direction, stepSize = tapStepMinutes) => {
      const current = Number.isFinite(Number(timeMinutesRef.current))
        ? Number(timeMinutesRef.current)
        : rangeStartRef.current ?? 0;
      const next = clampToRange(current + direction * stepSize);
      setTimeMinutes(next);
      updateDayEntry({ timeMinutes: next });
    },
    [clampToRange, updateDayEntry, tapStepMinutes],
  );

  const stopHold = useCallback(() => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    if (longPressActiveRef.current) {
      setTimeout(() => {
        longPressActiveRef.current = false;
      }, 0);
    }
  }, []);

  const startHold = useCallback(
    (direction) => {
      if (!canEdit) return;
      stopHold();
      holdTimeoutRef.current = setTimeout(() => {
        longPressActiveRef.current = true;
        stepMinutes(direction, holdStepMinutes);
        holdIntervalRef.current = setInterval(() => {
          stepMinutes(direction, holdStepMinutes);
        }, holdIntervalMs);
      }, holdDelayMs);
    },
    [canEdit, stepMinutes, stopHold, holdStepMinutes, holdDelayMs, holdIntervalMs],
  );

  useEffect(() => stopHold, [stopHold]);

  const handleTimePress = useCallback(
    (direction) => {
      if (!canEdit) return;
      if (longPressActiveRef.current) {
        longPressActiveRef.current = false;
        return;
      }
      stepMinutes(direction, tapStepMinutes);
    },
    [canEdit, stepMinutes, tapStepMinutes],
  );

  const handleHoldStop = useCallback(() => {
    stopHold();
    longPressActiveRef.current = false;
  }, [stopHold]);

  const formatTime = useCallback(
    (value) => formatTimeWithZone(value, locale, dayEntry?.timeZone),
    [dayEntry?.timeZone, locale],
  );

  const sunriseLabel = computed ? formatTime(computed.times.sunrise) : '--:--';
  const sunsetLabel = computed ? formatTime(computed.times.sunset) : '--:--';
  const formatISO = useCallback((value) => (value ? value.toISOString() : ''), []);

  const formatAzimuthLabel = useCallback((value) => {
    if (!Number.isFinite(value)) return '-';
    const angle = (value + 360) % 360;
    if (angle < 22.5 || angle >= 337.5) return t('sunSeeker.azimuth.n');
    if (angle < 67.5) return t('sunSeeker.azimuth.ne');
    if (angle < 112.5) return t('sunSeeker.azimuth.e');
    if (angle < 157.5) return t('sunSeeker.azimuth.se');
    if (angle < 202.5) return t('sunSeeker.azimuth.s');
    if (angle < 247.5) return t('sunSeeker.azimuth.sw');
    if (angle < 292.5) return t('sunSeeker.azimuth.w');
    return t('sunSeeker.azimuth.nw');
  }, [t]);

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

  const validation = useMemo(() => {
    if (!computed?.times || !locationReady) {
      return { ok: false, warnings: [t('sunSeeker.warning.no_data')] };
    }
    const times = computed.times;
    const seq = [
      { key: 'dawn', value: times.dawn },
      { key: 'sunrise', value: times.sunrise },
      { key: 'goldenHourStart', value: times.goldenHourStart },
      { key: 'goldenHourEnd', value: times.goldenHourEnd },
      { key: 'solarNoon', value: times.solarNoon },
      { key: 'goldenHourEndPm', value: times.goldenHourEnd },
      { key: 'sunset', value: times.sunset },
      { key: 'dusk', value: times.dusk },
    ];
    const warnings = [];
    const orderedTimes = seq.map((item) => item.value).filter(Boolean);
    for (let i = 1; i < orderedTimes.length; i += 1) {
      if (orderedTimes[i] && orderedTimes[i - 1] && orderedTimes[i] < orderedTimes[i - 1]) {
        warnings.push(t('sunSeeker.warning.order'));
        break;
      }
    }
    if (times.dawn && times.dusk && times.dawn > times.dusk) {
      warnings.push(t('sunSeeker.warning.dawn_dusk'));
    }
    if (rangeStart != null && rangeEnd != null && rangeStart >= rangeEnd) {
      warnings.push(t('sunSeeker.warning.blue_range'));
    }
    if (!times.sunrise || !times.sunset) {
      warnings.push(t('sunSeeker.warning.no_sunrise'));
    }
    return { ok: warnings.length === 0, warnings };
  }, [computed, locationReady, rangeStart, rangeEnd, t]);

  const isSameDay = useCallback(
    (a, b) =>
      a &&
      b &&
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate(),
    [],
  );

  const calendarMatrix = useMemo(() => buildMonthMatrix(dateCursor), [buildMonthMatrix, dateCursor]);

  useEffect(() => {
    if (!datePickerVisible) return;
    const baseDate = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : new Date();
    setDateCursor(baseDate);
  }, [datePickerVisible, parsedDate]);

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
      updateDayEntry({ date: value });
      setDatePickerVisible(false);
    },
    [updateDayEntry, canEdit],
  );

  const handleExport = useCallback(async () => {
    if (!onExport || !canExport) return;
    await onExport();
  }, [onExport, canExport]);

  return (
    <View style={localStyles.root}>
      <View style={localStyles.section}>
        <View style={localStyles.sectionHeader}>
          <Text style={localStyles.sectionTitle}>{t('sunSeeker.section.location')}</Text>
          <View style={localStyles.sectionHeaderRight}>
            {showApprox ? (
              <View style={[localStyles.badge, localStyles.badgeWarn]}>
                <Text style={localStyles.badgeText}>{t('sunSeeker.badge.approx')}</Text>
              </View>
            ) : null}
            <View style={[localStyles.badge, gpsTone === 'success' ? localStyles.badgeOk : localStyles.badgeWarn]}>
              <Text style={localStyles.badgeText}>{gpsBadge}</Text>
            </View>
          </View>
        </View>
        <View style={localStyles.savedRow}>
          <View style={localStyles.pickerWrapperWide}>
            <LabeledPicker
              styles={styles}
              label={t('sunSeeker.saved.label')}
              selectedValue={activeConfigId}
              onValueChange={handleSelectConfig}
              options={configOptions}
            />
          </View>
          <View style={localStyles.savedActions}>
            <TouchableOpacity
              style={[styles?.actionPrimary, !canEdit && styles?.actionPrimaryDisabled]}
              onPress={handleSaveConfig}
              disabled={!canEdit}
            >
              <Text
                style={[styles?.actionPrimaryText, !canEdit && styles?.actionPrimaryDisabledText]}
              >
                {t('sunSeeker.saved.save')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[localStyles.actionDanger, (!canEdit || !activeConfigId) && localStyles.actionDangerDisabled]}
              onPress={handleDeleteConfig}
              disabled={!canEdit || !activeConfigId}
            >
              <Text style={localStyles.actionDangerText}>{t('sunSeeker.saved.delete')}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={localStyles.sectionHint}>
          {locationReady ? t('sunSeeker.gps.active') : t('sunSeeker.gps.inactive')}
        </Text>
        {showApprox ? (
          <Text style={localStyles.sectionHint}>{t('sunSeeker.hint.approx')}</Text>
        ) : null}
        <View style={styles?.rowSplit}>
          <View style={localStyles.pickerWrapper}>
            <LabeledPicker
              styles={styles}
              label={t('sunSeeker.field.country')}
              selectedValue={countryValue}
              onValueChange={updateCountry}
              options={COUNTRY_OPTIONS}
            />
          </View>
          <View style={localStyles.pickerWrapper}>
            <LabeledPicker
              styles={styles}
              label={t('sunSeeker.field.city')}
              selectedValue={dayEntry.city || ''}
              onValueChange={updateCity}
              options={cityOptions.length ? cityOptions : [{ value: '', label: t('sunSeeker.field.country_select') }]}
            />
          </View>
        </View>
        <Text style={localStyles.sectionHint}>
          {t('sunSeeker.hint.country_city')}
        </Text>
        <View style={localStyles.row}>
          <TouchableOpacity
            style={[styles?.actionPrimary, !canEdit && styles?.actionPrimaryDisabled]}
            onPress={requestDeviceLocation}
            disabled={!canEdit}
          >
            <Text style={[styles?.actionPrimaryText, !canEdit && styles?.actionPrimaryDisabledText]}>
              {t('sunSeeker.gps.use')}
            </Text>
          </TouchableOpacity>
          {status ? <Text style={localStyles.statusText}>{status}</Text> : null}
        </View>
      </View>

      <View style={localStyles.section}>
        <Text style={localStyles.sectionTitle}>{t('sunSeeker.section.date')}</Text>
        <TouchableOpacity
          style={[styles?.textInput, localStyles.dateRow]}
          onPress={() => setDatePickerVisible(true)}
          disabled={!canEdit}
        >
          <Text style={localStyles.dateLabel}>{t('sunSeeker.field.day')}</Text>
          <Text style={localStyles.dateValue}>{formatDate(selectedDate) || t('sunSeeker.action.select')}</Text>
        </TouchableOpacity>
      </View>

      <View style={localStyles.section}>
        <View style={localStyles.sectionHeader}>
          <Text style={localStyles.sectionTitle}>{t('sunSeeker.section.sun')}</Text>
          <View style={localStyles.sectionHeaderRight}>
            <View style={[localStyles.badge, validation.ok ? localStyles.badgeOk : localStyles.badgeWarn]}>
              <Text style={localStyles.badgeText}>
                {validation.ok ? t('sunSeeker.validation.ok') : t('sunSeeker.validation.review')}
              </Text>
            </View>
            <View style={localStyles.paletteRow}>
            {['#1d4ed8', '#38bdf8', '#22c55e', '#facc15', '#f97316', '#ef4444'].map((color) => (
              <View key={color} style={[localStyles.paletteSwatch, { backgroundColor: color }]} />
            ))}
          </View>
          </View>
        </View>
        <View style={localStyles.timeControlRow}>
          <Text style={localStyles.timeControlLabel}>{t('sunSeeker.field.time')}</Text>
          <View style={localStyles.timeControlButtons}>
            <Pressable
              style={localStyles.timeStepButton}
              onPress={() => handleTimePress(-1)}
              onPressIn={() => startHold(-1)}
              onPressOut={handleHoldStop}
              onMouseDown={() => startHold(-1)}
              onMouseUp={handleHoldStop}
              onMouseLeave={handleHoldStop}
              onTouchStart={() => startHold(-1)}
              onTouchEnd={handleHoldStop}
              disabled={!canEdit}
            >
              <Text style={localStyles.timeStepText}>-</Text>
            </Pressable>
            <View style={localStyles.timeValueCard}>
              <Text style={localStyles.timeValueText}>{formatMinutes(timeMinutes)}</Text>
              <Text style={localStyles.timeRangeText}>
                {rangeStart != null && rangeEnd != null
                  ? `${formatMinutes(rangeStart)} - ${formatMinutes(rangeEnd)}`
                  : t('sunSeeker.blue_range')}
              </Text>
            </View>
            <Pressable
              style={localStyles.timeStepButton}
              onPress={() => handleTimePress(1)}
              onPressIn={() => startHold(1)}
              onPressOut={handleHoldStop}
              onMouseDown={() => startHold(1)}
              onMouseUp={handleHoldStop}
              onMouseLeave={handleHoldStop}
              onTouchStart={() => startHold(1)}
              onTouchEnd={handleHoldStop}
              disabled={!canEdit}
            >
              <Text style={localStyles.timeStepText}>+</Text>
            </Pressable>
          </View>
        </View>
        <View style={localStyles.compassRow}>
          <View style={localStyles.compassCard}>
            <Text style={localStyles.compassLabel}>{t('sunSeeker.field.azimuth')}</Text>
            <View style={localStyles.compassDialRing} />
            <View style={localStyles.compassDial}>
              <Text style={[localStyles.compassMark, localStyles.compassNorth]}>{t('sunSeeker.compass.n')}</Text>
              <Text style={[localStyles.compassMark, localStyles.compassEast]}>{t('sunSeeker.compass.e')}</Text>
              <Text style={[localStyles.compassMark, localStyles.compassSouth]}>{t('sunSeeker.compass.s')}</Text>
              <Text style={[localStyles.compassMark, localStyles.compassWest]}>{t('sunSeeker.compass.w')}</Text>
              <Text style={[localStyles.compassMarkSmall, localStyles.compassNE]}>{t('sunSeeker.compass.ne')}</Text>
              <Text style={[localStyles.compassMarkSmall, localStyles.compassSE]}>{t('sunSeeker.compass.se')}</Text>
              <Text style={[localStyles.compassMarkSmall, localStyles.compassSW]}>{t('sunSeeker.compass.sw')}</Text>
              <Text style={[localStyles.compassMarkSmall, localStyles.compassNW]}>{t('sunSeeker.compass.nw')}</Text>
              <View
                style={[
                  localStyles.compassNeedle,
                  {
                    transform: [
                      { translateX: -4 },
                      { translateY: -36 },
                      { rotate: `${computed ? computed.position.azimuth : 0}deg` },
                    ],
                  },
                ]}
              >
                <View style={localStyles.compassNeedleRed}>
                  <View style={localStyles.compassNeedleArrow} />
                </View>
                <View style={localStyles.compassNeedleWhite} />
              </View>
              <View style={localStyles.compassCenter} />
            </View>
            <Text style={localStyles.compassValue}>
              {computed ? `${Math.round(computed.position.azimuth)}°` : '--'}
            </Text>
            <Text style={localStyles.compassSub}>
              {computed ? formatAzimuthLabel(computed.position.azimuth) : '-'} · {t('sunSeeker.compass.red_tip')}
            </Text>
          </View>
        </View>
        <View style={styles?.metricRow}>
          <View style={styles?.metricCard}>
            <Text style={styles?.metricLabel}>{t('sunSeeker.field.azimuth')}</Text>
            <Text style={styles?.metricValue}>
              {computed ? `${Math.round(computed.position.azimuth)}°` : '--'}
            </Text>
            <Text style={styles?.metricSubValue}>{t('sunSeeker.azimuth.north_zero')}</Text>
          </View>
          <View style={styles?.metricCard}>
            <Text style={styles?.metricLabel}>{t('sunSeeker.field.altitude')}</Text>
            <Text style={styles?.metricValue}>
              {computed ? `${computed.position.altitude.toFixed(1)}°` : '--'}
            </Text>
            <Text style={styles?.metricSubValue}>{t('sunSeeker.altitude.horizon_zero')}</Text>
          </View>
          <View style={styles?.metricCard}>
            <Text style={styles?.metricLabel}>{t('sunSeeker.field.solar_noon')}</Text>
            <Text style={styles?.metricValue}>
              {computed ? formatTime(computed.times.solarNoon) : '--:--'}
            </Text>
          </View>
        </View>
      </View>

      <View style={localStyles.section}>
        <Text style={localStyles.sectionTitle}>{t('sunSeeker.section.golden')}</Text>
        <View style={styles?.metricRow}>
          <View style={styles?.metricCard}>
            <Text style={styles?.metricLabel}>{t('sunSeeker.field.sunrise')}</Text>
            <Text style={styles?.metricValue}>
              {computed ? formatTime(computed.times.sunrise) : '--:--'}
            </Text>
            <Text style={styles?.metricSubValue}>{t('sunSeeker.field.golden_start')}</Text>
          </View>
          <View style={styles?.metricCard}>
            <Text style={styles?.metricLabel}>{t('sunSeeker.field.golden_end_am')}</Text>
            <Text style={styles?.metricValue}>
              {computed ? formatTime(computed.times.goldenHourStart) : '--:--'}
            </Text>
          </View>
          <View style={styles?.metricCard}>
            <Text style={styles?.metricLabel}>{t('sunSeeker.field.golden_start_pm')}</Text>
            <Text style={styles?.metricValue}>
              {computed ? formatTime(computed.times.goldenHourEnd) : '--:--'}
            </Text>
          </View>
          <View style={styles?.metricCard}>
            <Text style={styles?.metricLabel}>{t('sunSeeker.field.sunset')}</Text>
            <Text style={styles?.metricValue}>
              {computed ? formatTime(computed.times.sunset) : '--:--'}
            </Text>
          </View>
        </View>
      </View>

      <View style={localStyles.section}>
        <Text style={localStyles.sectionTitle}>{t('sunSeeker.section.blue')}</Text>
        <View style={styles?.metricRow}>
          <View style={styles?.metricCard}>
            <Text style={styles?.metricLabel}>{t('sunSeeker.field.blue_start_am')}</Text>
            <Text style={styles?.metricValue}>
              {computed ? formatTime(computed.times.dawn) : '--:--'}
            </Text>
          </View>
          <View style={styles?.metricCard}>
            <Text style={styles?.metricLabel}>{t('sunSeeker.field.blue_end_am')}</Text>
            <Text style={styles?.metricValue}>
              {computed ? formatTime(computed.times.blueHourStart) : '--:--'}
            </Text>
          </View>
          <View style={styles?.metricCard}>
            <Text style={styles?.metricLabel}>{t('sunSeeker.field.blue_start_pm')}</Text>
            <Text style={styles?.metricValue}>
              {computed ? formatTime(computed.times.blueHourEnd) : '--:--'}
            </Text>
          </View>
          <View style={styles?.metricCard}>
            <Text style={styles?.metricLabel}>{t('sunSeeker.field.blue_end')}</Text>
            <Text style={styles?.metricValue}>
              {computed ? formatTime(computed.times.dusk) : '--:--'}
            </Text>
          </View>
        </View>
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
            {t('sunSeeker.export.pdf')}
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
          <Pressable style={localStyles.datePanel} onPress={(event) => event.stopPropagation()}>
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
              <View style={localStyles.dateWeekHeader}>
                {(locale === 'en' ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : ['L', 'M', 'X', 'J', 'V', 'S', 'D']).map((label) => (
                  <View key={label} style={localStyles.dateWeekCell}>
                    <Text style={localStyles.dateWeekText}>{label}</Text>
                  </View>
                ))}
              </View>
              {calendarMatrix.map((week, weekIndex) => (
                <View key={`week-${weekIndex}`} style={localStyles.dateWeek}>
                  {week.map((day) => {
                    const isSelected = selectedDate && isSameDay(day.date, parsedDate);
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
              <Text style={styles?.actionPrimaryText}>{t('sunSeeker.date.close')}</Text>
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
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: 'PixelHeading',
    fontSize: 12,
    color: colors.text,
    letterSpacing: 1,
  },
  sectionHint: {
    fontFamily: 'PixelBody',
    fontSize: 10,
    color: colors.textMuted,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.surfaceAlt11,
  },
  badgeOk: {
    borderColor: colors.success,
  },
  badgeWarn: {
    borderColor: colors.accent,
  },
  badgeText: {
    fontFamily: 'PixelHeading',
    fontSize: 10,
    color: colors.text,
  },
  input: {
    minWidth: 200,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  statusText: {
    fontFamily: 'PixelBody',
    fontSize: 10,
    color: colors.accent,
  },
  pickerWrapper: {
    flex: 1,
    minWidth: 200,
  },
  timeControlRow: {
    marginTop: 8,
    gap: 8,
    alignItems: 'center',
  },
  timeControlLabel: {
    fontFamily: 'PixelBody',
    fontSize: 10,
    color: colors.textMuted,
  },
  timeControlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
  },
  timeStepButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surfaceAlt11,
    minWidth: 40,
    alignItems: 'center',
  },
  timeStepText: {
    fontFamily: 'PixelHeading',
    fontSize: 14,
    color: colors.accent,
  },
  timeValueCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surfaceAlt2,
    minWidth: 140,
  },
  timeValueText: {
    fontFamily: 'PixelHeading',
    fontSize: 14,
    color: colors.text,
  },
  timeRangeText: {
    fontFamily: 'PixelBody',
    fontSize: 10,
    color: colors.textSubtle,
    marginTop: 4,
  },
  pickerWrapperWide: {
    flex: 1,
    minWidth: 260,
  },
  savedRow: {
    gap: 10,
    marginBottom: 8,
  },
  savedActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionDanger: {
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: rgba.dangerSoft,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  actionDangerDisabled: {
    opacity: 0.5,
  },
  actionDangerText: {
    color: colors.dangerText,
    fontFamily: 'PixelHeading',
    fontSize: 12,
    letterSpacing: 1,
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
  paletteRow: {
    flexDirection: 'row',
    gap: 6,
  },
  paletteSwatch: {
    width: 18,
    height: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: rgba.borderShadow,
  },
  compassRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
  },
  compassCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 18,
    backgroundColor: colors.surfaceAlt11,
    minWidth: 260,
    alignItems: 'center',
    gap: 12,
  },
  compassLabel: {
    fontFamily: 'PixelBody',
    fontSize: 10,
    color: colors.textMuted,
  },
  compassDial: {
    width: 168,
    height: 168,
    borderRadius: 84,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compassDialRing: {
    position: 'absolute',
    width: 182,
    height: 182,
    borderRadius: 91,
    borderWidth: 2,
    borderColor: colors.info,
    boxShadow: `0 0 0 2px ${colors.info}, 0 0 0 4px ${colors.success}, 0 0 0 6px ${colors.warning}, 0 0 0 8px ${colors.accent}`,
  },
  compassMark: {
    position: 'absolute',
    fontFamily: 'PixelHeading',
    fontSize: 10,
    color: colors.text,
  },
  compassMarkSmall: {
    position: 'absolute',
    fontFamily: 'PixelHeading',
    fontSize: 8,
    color: colors.textMuted,
  },
  compassNorth: { top: 10 },
  compassEast: { right: 10 },
  compassSouth: { bottom: 10 },
  compassWest: { left: 10 },
  compassNE: { top: 26, right: 26 },
  compassSE: { bottom: 26, right: 26 },
  compassSW: { bottom: 26, left: 26 },
  compassNW: { top: 26, left: 26 },
  compassNeedle: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 8,
    height: 72,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compassNeedleRed: {
    width: 6,
    height: 30,
    backgroundColor: colors.danger,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  compassNeedleWhite: {
    width: 6,
    height: 30,
    backgroundColor: colors.text,
    borderRadius: 2,
  },
  compassNeedleArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.danger,
    marginTop: -10,
  },
  compassCenter: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  compassValue: {
    fontFamily: 'PixelHeading',
    fontSize: 12,
    color: colors.text,
  },
  compassSub: {
    fontFamily: 'PixelBody',
    fontSize: 10,
    color: colors.textMuted,
  },
  dateOverlay: {
    flex: 1,
    backgroundColor: rgba.overlay,
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
  dateWeekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dateWeekCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  dateWeekText: {
    fontFamily: 'PixelHeading',
    fontSize: 9,
    color: colors.textMuted,
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

export default React.memo(SunSeekerModule);
