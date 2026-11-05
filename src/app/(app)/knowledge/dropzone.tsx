import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { PageTitle } from '@/components/page-title';
import { Loader, PressableScale, Text } from '@/components/ui';
import { colors, haptics, riseIn, shape, space } from '@/theme';
import {
  ANALYSIS_MODES,
  type AnalysisMode,
  cancelUpload,
  DOCUMENT_TYPES,
  dismissUpload,
  HELPFUL_DOCUMENTS,
  isWorking,
  MAX_FILE_BYTES,
  type MergedConflict,
  mergedConflicts,
  type PickedFile,
  resolveConflict,
  retryUpload,
  summarize,
  type Upload,
  uploadDocument,
  useUploads,
} from '@/features/knowledge/dropzone';
import { siteUrl } from '@/lib/guide';

const MAX_AT_ONCE = 5;

/**
 * The Dropzone: scan or pick your CV, transcripts and certificates, and
 * Unive reads them and fills in your Knowledge Library (the website's
 * Dropzone tab). Opened from the library.
 */
export default function DropzoneScreen() {
  const uploads = useUploads();
  const conflicts = mergedConflicts(uploads);
  const [mode, setMode] = useState<AnalysisMode>('faster');

  async function send(files: PickedFile[]) {
    const tooBig = files.filter((file) => file.size != null && file.size > MAX_FILE_BYTES);
    if (tooBig.length) {
      Alert.alert('File too large', `${tooBig.map((file) => file.name).join(', ')} is over 5 MB. Try a smaller file or a photo of each page.`);
    }
    const ok = files.filter((file) => !tooBig.includes(file)).slice(0, MAX_AT_ONCE);
    if (!ok.length) return;
    haptics.success();
    const results = await Promise.all(ok.map((file) => uploadDocument(file, mode)));
    if (results.some((result) => result.duplicate)) {
      Alert.alert('Already added', 'You added this file before, so Unive used what it found then.');
    }
  }

  async function scan() {
    if (!(await ImagePicker.requestCameraPermissionsAsync()).granted) {
      Alert.alert('No camera access', 'Allow Unive to use the camera in Settings to scan a document.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 });
    const asset = result.assets?.[0];
    if (result.canceled || !asset) return;
    const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ').replace(':', '.');
    await send([{ uri: asset.uri, name: `Scan ${stamp}.jpg`, mimeType: asset.mimeType ?? 'image/jpeg', size: asset.fileSize }]);
  }

  async function photos() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
      allowsMultipleSelection: true,
      selectionLimit: MAX_AT_ONCE,
    });
    if (result.canceled) return;
    await send(
      result.assets.map((asset, index) => ({
        uri: asset.uri,
        name: asset.fileName ?? `Photo ${index + 1}.jpg`,
        mimeType: asset.mimeType ?? 'image/jpeg',
        size: asset.fileSize,
      })),
    );
  }

  async function files() {
    const result = await DocumentPicker.getDocumentAsync({ type: DOCUMENT_TYPES, copyToCacheDirectory: true });
    if (result.canceled) return;
    await send(
      result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? 'application/octet-stream',
        size: asset.size,
      })),
    );
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <PageTitle>Dropzone</PageTitle>
          <Image source={{ uri: siteUrl('/isomorphic-icons/wingsuit.webp') }} style={styles.titleArt} contentFit="contain" />
        </View>
        <Text variant="small" color="textSecondary">
          Add your documents and Unive fills in your Knowledge Library, so you don’t have to type it all.
        </Text>
      </View>

      <View style={styles.actions}>
        <Action symbol="doc.viewfinder" label="Scan" onPress={scan} />
        <Action symbol="photo.on.rectangle" label="Photos" onPress={photos} />
        <Action symbol="folder" label="Files" onPress={files} />
      </View>

      <View style={styles.modes}>
        {ANALYSIS_MODES.map((option) => {
          const active = option.value === mode;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => {
                haptics.tick();
                setMode(option.value);
              }}
              style={[styles.mode, active && styles.modeActive]}>
              <Text variant="label" color={active ? 'text' : 'textSecondary'}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text variant="small" color="textMuted" style={styles.modeDetail}>
        {ANALYSIS_MODES.find((option) => option.value === mode)!.detail}
      </Text>

      {conflicts.length ? (
        <Section title="Check these" note="A document says something different from your profile. Choose which to keep.">
          {conflicts.map((conflict) => (
            <ConflictCard key={conflict.key} conflict={conflict} />
          ))}
        </Section>
      ) : null}

      {uploads.length ? (
        <Section title="Your documents" note="Unive keeps reading after you leave this page.">
          <View style={[styles.card, styles.list]}>
            {uploads.map((upload, index) => (
              <Animated.View key={upload.jobId} entering={FadeIn} layout={LinearTransition}>
                {index > 0 ? <View style={styles.separator} /> : null}
                <UploadRow upload={upload} />
              </Animated.View>
            ))}
          </View>
        </Section>
      ) : (
        <Section title="What to add">
          <View style={[styles.card, styles.helpful]}>
            {HELPFUL_DOCUMENTS.map((item) => (
              <View key={item} style={styles.helpfulRow}>
                <SymbolView name="checkmark.circle.fill" size={18} tintColor={colors.accent} />
                <Text variant="callout" style={styles.flex}>
                  {item}
                </Text>
              </View>
            ))}
          </View>
          <Text variant="small" color="textMuted" style={styles.formats}>
            PDF, Word, text, spreadsheets or photos, up to 5 MB each.
          </Text>
        </Section>
      )}
    </ScrollView>
  );
}

function Action({ symbol, label, onPress }: { symbol: SFSymbol; label: string; onPress: () => void }) {
  return (
    <View style={styles.flex}>
      <PressableScale haptic accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.card, styles.action]}>
        <View style={styles.actionIcon}>
          <SymbolView name={symbol} size={26} tintColor={colors.accent} />
        </View>
        <Text variant="label">{label}</Text>
      </PressableScale>
    </View>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <Animated.View entering={riseIn(0)} layout={LinearTransition} style={styles.section}>
      <View style={styles.sectionHead}>
        <Text variant="headline">{title}</Text>
        {note ? (
          <Text variant="small" color="textSecondary">
            {note}
          </Text>
        ) : null}
      </View>
      {children}
    </Animated.View>
  );
}

const FILE_ICONS: Record<string, string> = {
  pdf: 'pdf',
  doc: 'doc',
  docx: 'doc',
  txt: 'txt',
  md: 'txt',
  csv: 'xls',
  xls: 'xls',
  xlsx: 'xls',
  jpg: 'jpg',
  jpeg: 'jpg',
  png: 'png',
  webp: 'png',
  heic: 'jpg',
};

function UploadRow({ upload }: { upload: Upload }) {
  const router = useRouter();
  const extension = upload.fileName.toLowerCase().split('.').pop() ?? '';
  const icon = siteUrl(`/file-types/${FILE_ICONS[extension] ?? 'pdf-plain'}.webp`);
  const job = upload.job;

  let status: string;
  let tone: 'textSecondary' | 'dangerText' | 'accent' = 'textSecondary';
  if (upload.uploading) status = 'Uploading…';
  else if (upload.failed) {
    status = upload.failed;
    tone = 'dangerText';
  } else if (!job || job.status === 'analyzing') status = 'Reading…';
  else if (job.status === 'applying') status = 'Adding to your library…';
  else if (job.status === 'ready') {
    status = summarize(job.result.applied);
    tone = 'accent';
  } else if (job.status === 'error') {
    status = job.error;
    tone = 'dangerText';
  } else status = 'Stopped';

  const working = isWorking(upload);
  const failed = upload.failed || job?.status === 'error';

  return (
    <View style={styles.upload}>
      <Image source={{ uri: icon }} style={styles.fileIcon} contentFit="contain" />
      <View style={styles.uploadText}>
        <Text variant="headline" numberOfLines={1}>
          {upload.fileName}
        </Text>
        <Text variant="small" color={tone} numberOfLines={2}>
          {status}
        </Text>
        {job?.status === 'ready' ? (
          <Pressable accessibilityRole="link" onPress={() => router.back()} hitSlop={8}>
            <Text variant="label" color="accent">
              See your library
            </Text>
          </Pressable>
        ) : null}
      </View>
      {working ? (
        <View style={styles.uploadSide}>
          <Loader size={16} color={colors.textSecondary} accessibilityLabel="" />
          {!upload.uploading ? (
            <Pressable accessibilityRole="button" hitSlop={8} onPress={() => void cancelUpload(upload.jobId)}>
              <Text variant="small" color="textSecondary">
                Stop
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View style={styles.uploadSide}>
          {failed && !upload.failed ? (
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => retryUpload(upload.jobId).catch(() => Alert.alert("Couldn't try again", 'Please add the file again.'))}>
              <Text variant="label" color="accent">
                Try again
              </Text>
            </Pressable>
          ) : null}
          <Pressable accessibilityRole="button" accessibilityLabel="Remove from list" hitSlop={10} onPress={() => dismissUpload(upload.jobId)}>
            <SymbolView name="xmark.circle.fill" size={20} tintColor={colors.textMuted} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

function ConflictCard({ conflict }: { conflict: MergedConflict }) {
  const [saving, setSaving] = useState<string | null>(null);

  async function keep(value: string | number) {
    setSaving(String(value));
    try {
      await resolveConflict(conflict, value);
      haptics.success();
    } catch (error) {
      Alert.alert("Couldn't save", error instanceof Error ? error.message : 'Please try again.');
      setSaving(null);
    }
  }

  return (
    <View style={[styles.card, styles.conflict]}>
      <View style={styles.conflictHead}>
        <View style={styles.flex}>
          <Text variant="headline">{conflict.label}</Text>
          <Text variant="small" color="textSecondary" numberOfLines={1}>
            {conflict.fileNames.join(', ')}
          </Text>
        </View>
        <Image source={{ uri: siteUrl('/isomorphic-icons/conflict.webp') }} style={styles.conflictArt} contentFit="contain" />
      </View>
      {conflict.detail ? (
        <Text variant="small" color="textMuted">
          {conflict.detail}
        </Text>
      ) : null}
      {conflict.options.map((option) => (
        <PressableScale
          key={`${option.source}:${option.value}`}
          haptic
          accessibilityRole="button"
          disabled={saving != null}
          onPress={() => keep(option.value)}
          style={[styles.option, saving != null && saving !== String(option.value) && styles.optionFaded]}>
          <View style={styles.flex}>
            <Text variant="headline">{String(option.value)}</Text>
            <Text variant="small" color="textSecondary">
              {option.source === 'profile' ? 'Your profile' : 'From your document'}
            </Text>
          </View>
          {saving === String(option.value) ? (
            <Loader size={16} color={colors.accent} accessibilityLabel="Saving" />
          ) : (
            <Text variant="label" color="accent">
              Keep
            </Text>
          )}
        </PressableScale>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: space[4], paddingBottom: space[16], gap: space[4] },
  header: { paddingHorizontal: space[1], gap: space[1] },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  titleArt: { width: 44, height: 44 },
  card: { ...shape.card, backgroundColor: colors.surface },
  actions: { flexDirection: 'row', gap: space[2] + space[1], marginTop: space[1] },
  action: { alignItems: 'center', paddingVertical: space[4] + space[1], gap: space[2] },
  actionIcon: {
    ...shape.pill,
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
  modes: {
    flexDirection: 'row',
    alignSelf: 'center',
    padding: 3,
    gap: space[0.5],
    ...shape.pill,
    backgroundColor: colors.fillPressed,
  },
  mode: { paddingHorizontal: space[4], paddingVertical: space[1.5], ...shape.pill },
  modeActive: { backgroundColor: colors.surface },
  modeDetail: { textAlign: 'center', marginTop: -space[2] },
  section: { gap: space[2], marginTop: space[2] },
  sectionHead: { paddingHorizontal: space[1], gap: space[0.5] },
  list: { paddingHorizontal: space[4] },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 48 },
  upload: { flexDirection: 'row', alignItems: 'center', gap: space[4], paddingVertical: space[4] },
  fileIcon: { width: 32, height: 38 },
  uploadText: { flex: 1, gap: space[0.5] },
  uploadSide: { alignItems: 'center', gap: space[2] },
  helpful: { padding: space[4], gap: space[2] + 2 },
  helpfulRow: { flexDirection: 'row', alignItems: 'center', gap: space[2] + 2 },
  formats: { paddingHorizontal: space[1] },
  conflict: { padding: space[4], gap: space[2] + 2 },
  conflictHead: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  conflictArt: { width: 44, height: 44 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    ...shape.tile,
    backgroundColor: colors.backgroundGrouped,
  },
  optionFaded: { opacity: 0.4 },
});
