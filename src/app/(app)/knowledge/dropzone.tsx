import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';

import { PageTitle } from '@/components/page-title';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Shape, Spacing } from '@/constants/theme';
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
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
        <ThemedText type="small" themeColor="textSecondary">
          Add your documents and Unive fills in your Knowledge Library, so you don’t have to type it all.
        </ThemedText>
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
                void Haptics.selectionAsync();
                setMode(option.value);
              }}
              style={[styles.mode, active && styles.modeActive]}>
              <ThemedText style={[styles.modeLabel, active && styles.modeLabelActive]}>{option.label}</ThemedText>
            </Pressable>
          );
        })}
      </View>
      <ThemedText type="small" themeColor="textMuted" style={styles.modeDetail}>
        {ANALYSIS_MODES.find((option) => option.value === mode)!.detail}
      </ThemedText>

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
                <SymbolView name="checkmark.circle.fill" size={18} tintColor={Colors.olive} />
                <ThemedText style={styles.helpfulText}>{item}</ThemedText>
              </View>
            ))}
          </View>
          <ThemedText type="small" themeColor="textMuted" style={styles.formats}>
            PDF, Word, text, spreadsheets or photos, up to 5 MB each.
          </ThemedText>
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
          <SymbolView name={symbol} size={26} tintColor={Colors.olive} />
        </View>
        <ThemedText style={styles.actionLabel}>{label}</ThemedText>
      </PressableScale>
    </View>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <Animated.View entering={FadeInDown.duration(320)} layout={LinearTransition} style={styles.section}>
      <View style={styles.sectionHead}>
        <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
        {note ? (
          <ThemedText type="small" themeColor="textSecondary">
            {note}
          </ThemedText>
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
  let tone: 'textSecondary' | 'destructive' | 'olive' = 'textSecondary';
  if (upload.uploading) status = 'Uploading…';
  else if (upload.failed) {
    status = upload.failed;
    tone = 'destructive';
  } else if (!job || job.status === 'analyzing') status = 'Reading…';
  else if (job.status === 'applying') status = 'Adding to your library…';
  else if (job.status === 'ready') {
    status = summarize(job.result.applied);
    tone = 'olive';
  } else if (job.status === 'error') {
    status = job.error;
    tone = 'destructive';
  } else status = 'Stopped';

  const working = isWorking(upload);
  const failed = upload.failed || job?.status === 'error';

  return (
    <View style={styles.upload}>
      <Image source={{ uri: icon }} style={styles.fileIcon} contentFit="contain" />
      <View style={styles.uploadText}>
        <ThemedText numberOfLines={1} style={styles.fileName}>
          {upload.fileName}
        </ThemedText>
        <ThemedText type="small" themeColor={tone} numberOfLines={2}>
          {status}
        </ThemedText>
        {job?.status === 'ready' ? (
          <Pressable accessibilityRole="link" onPress={() => router.back()} hitSlop={8}>
            <ThemedText type="small" style={styles.link}>
              See your library
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
      {working ? (
        <View style={styles.uploadSide}>
          <ActivityIndicator size="small" color={Colors.textSecondary} />
          {!upload.uploading ? (
            <Pressable accessibilityRole="button" hitSlop={8} onPress={() => void cancelUpload(upload.jobId)}>
              <ThemedText type="small" themeColor="textSecondary">
                Stop
              </ThemedText>
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
              <ThemedText type="small" style={styles.link}>
                Try again
              </ThemedText>
            </Pressable>
          ) : null}
          <Pressable accessibilityRole="button" accessibilityLabel="Remove from list" hitSlop={10} onPress={() => dismissUpload(upload.jobId)}>
            <SymbolView name="xmark.circle.fill" size={20} tintColor={Colors.textMuted} />
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
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert("Couldn't save", error instanceof Error ? error.message : 'Please try again.');
      setSaving(null);
    }
  }

  return (
    <View style={[styles.card, styles.conflict]}>
      <View style={styles.conflictHead}>
        <View style={styles.flex}>
          <ThemedText style={styles.conflictTitle}>{conflict.label}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {conflict.fileNames.join(', ')}
          </ThemedText>
        </View>
        <Image source={{ uri: siteUrl('/isomorphic-icons/conflict.webp') }} style={styles.conflictArt} contentFit="contain" />
      </View>
      {conflict.detail ? (
        <ThemedText type="small" themeColor="textMuted">
          {conflict.detail}
        </ThemedText>
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
            <ThemedText style={styles.optionValue}>{String(option.value)}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {option.source === 'profile' ? 'Your profile' : 'From your document'}
            </ThemedText>
          </View>
          {saving === String(option.value) ? (
            <ActivityIndicator size="small" color={Colors.olive} />
          ) : (
            <ThemedText style={styles.keep}>Keep</ThemedText>
          )}
        </PressableScale>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.six, gap: Spacing.three },
  header: { paddingHorizontal: Spacing.one, gap: Spacing.one },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  titleArt: { width: 44, height: 44 },
  card: { ...Shape.card, backgroundColor: Colors.backgroundElement },
  actions: { flexDirection: 'row', gap: Spacing.two + Spacing.one, marginTop: Spacing.one },
  action: { alignItems: 'center', paddingVertical: Spacing.three + Spacing.one, gap: Spacing.two },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f2e6',
  },
  actionLabel: { fontFamily: Fonts.sansSemiBold, fontSize: 15, lineHeight: 20 },
  modes: {
    flexDirection: 'row',
    alignSelf: 'center',
    padding: 3,
    gap: 2,
    ...Shape.pill,
    backgroundColor: '#e2e0d8',
  },
  mode: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.one + 2, ...Shape.pill },
  modeActive: { backgroundColor: Colors.backgroundElement },
  modeLabel: { fontFamily: Fonts.sansMedium, fontSize: 14, lineHeight: 18, color: Colors.textSecondary },
  modeLabelActive: { color: Colors.text },
  modeDetail: { textAlign: 'center', marginTop: -Spacing.two },
  section: { gap: Spacing.two, marginTop: Spacing.two },
  sectionHead: { paddingHorizontal: Spacing.one, gap: 2 },
  sectionTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 17, lineHeight: 22 },
  list: { paddingHorizontal: Spacing.three },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginLeft: 48 },
  upload: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.three },
  fileIcon: { width: 32, height: 38 },
  uploadText: { flex: 1, gap: 2 },
  fileName: { fontFamily: Fonts.sansMedium, fontSize: 15, lineHeight: 20 },
  uploadSide: { alignItems: 'center', gap: Spacing.two },
  link: { fontFamily: Fonts.sansMedium, color: Colors.olive },
  helpful: { padding: Spacing.three, gap: Spacing.two + 2 },
  helpfulRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two + 2 },
  helpfulText: { flex: 1, fontSize: 15, lineHeight: 21 },
  formats: { paddingHorizontal: Spacing.one },
  conflict: { padding: Spacing.three, gap: Spacing.two + 2 },
  conflictHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  conflictTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 17, lineHeight: 22 },
  conflictArt: { width: 44, height: 44 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two + 4,
    paddingHorizontal: Spacing.three,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: Colors.backgroundGrouped,
  },
  optionFaded: { opacity: 0.4 },
  optionValue: { fontFamily: Fonts.sansSemiBold, fontSize: 18, lineHeight: 24 },
  keep: { fontFamily: Fonts.sansSemiBold, fontSize: 15, color: Colors.olive },
});
