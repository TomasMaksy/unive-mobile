import { Host } from '@expo/ui';
import {
  Button,
  HStack,
  Image,
  LabeledContent,
  List,
  Picker,
  ProgressView,
  Section,
  Spacer,
  SwipeActions,
  Text,
  VStack,
} from '@expo/ui/swift-ui';
import {
  background,
  font,
  foregroundStyle,
  frame,
  kerning,
  lineLimit,
  listRowBackground,
  listRowInsets,
  listStyle,
  padding,
  pickerStyle,
  progressViewStyle,
  refreshable,
  scrollContentBackground,
  tag,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import type { SFSymbol } from 'sf-symbols-typescript';

import {
  countryName,
  KNOWLEDGE_COPY,
  KNOWLEDGE_TABS,
  type KnowledgeListProps,
  type KnowledgeTab,
} from '@/components/knowledge-list-types';
import { Colors } from '@/constants/theme';
import {
  CONNECTION_ROLES,
  EDUCATION_STAGES,
  EXPERIENCE_KINDS,
  formatMonth,
  formatRange,
  type KnowledgeKind,
  labelOf,
  PROFICIENCIES,
  schoolName,
} from '@/lib/knowledge';

const TITLE_SIZE = 34;
const PERCENT_SIZE = 44;

/**
 * The Knowledge Library as a native grouped list, like the Settings app: how
 * complete it is, then General / Activities / Other, the website's tabs.
 */
export function KnowledgeList({ knowledge, tab, onTabChange, onOpen, onDelete, onEditAcademics, onRefresh }: KnowledgeListProps) {
  const percent = Math.round(knowledge.completion.displayPercent);

  return (
    <Host style={{ flex: 1 }} colorScheme="light">
      <List
        modifiers={[
          listStyle('insetGrouped'),
          scrollContentBackground('hidden'),
          background(Colors.backgroundGrouped),
          tint(Colors.olive),
          refreshable(onRefresh),
        ]}>
        {/* The page's title, in the list rather than a navigation bar (it scrolls away). */}
        <Section modifiers={[listRowBackground('#00000000'), listRowInsets({ leading: 4, trailing: 0, top: 0, bottom: 0 })]}>
          <VStack alignment="leading" spacing={6}>
            <Text
              modifiers={[
                font({ family: 'AveriaSerifLibre-Regular', size: TITLE_SIZE }),
                kerning(TITLE_SIZE * -0.03),
                foregroundStyle(Colors.text),
              ]}>
              Knowledge Library
            </Text>
            <Text modifiers={[font({ textStyle: 'subheadline' }), foregroundStyle(Colors.textSecondary)]}>
              {KNOWLEDGE_COPY.subtitle}
            </Text>
          </VStack>
        </Section>

        {/* How complete it is, with the website's three parts. */}
        <Section>
          <VStack alignment="leading" spacing={12} modifiers={[padding({ vertical: 6 })]}>
            <HStack alignment="firstTextBaseline" spacing={6}>
              <Text
                modifiers={[
                  font({ family: 'AveriaSerifLibre-Regular', size: PERCENT_SIZE }),
                  kerning(PERCENT_SIZE * -0.03),
                  foregroundStyle(Colors.text),
                ]}>
                {`${percent}%`}
              </Text>
              <Text modifiers={[font({ textStyle: 'subheadline' }), foregroundStyle(Colors.textSecondary)]}>complete</Text>
            </HStack>
            <ProgressView value={percent / 100} modifiers={[progressViewStyle('linear'), tint(Colors.olive)]} />
            <HStack spacing={16}>
              <Part label="General" part={knowledge.completion.general} />
              <Part label="Activities" part={knowledge.completion.extracurriculars} />
              <Part label="Other" part={knowledge.completion.other} />
            </HStack>
          </VStack>
        </Section>

        <Section modifiers={[listRowBackground('#00000000'), listRowInsets({ leading: 0, trailing: 0, top: 0, bottom: 0 })]}>
          <Picker
            selection={tab}
            onSelectionChange={(value: string) => onTabChange(value as KnowledgeTab)}
            modifiers={[pickerStyle('segmented')]}>
            {KNOWLEDGE_TABS.map((option) => (
              <Text key={option.value} modifiers={[tag(option.value)]}>
                {option.label}
              </Text>
            ))}
          </Picker>
        </Section>

        {tab === 'general' && <General {...{ knowledge, onEditAcademics }} />}
        {tab === 'activities' && <Activities {...{ knowledge, onOpen, onDelete }} />}
        {tab === 'other' && <Other {...{ knowledge, onOpen, onDelete }} />}
      </List>
    </Host>
  );
}

function Part({ label, part }: { label: string; part: { earned: number; max: number } }) {
  return (
    <VStack alignment="leading" spacing={4}>
      <Text modifiers={[font({ size: 12, weight: 'semibold' }), foregroundStyle(Colors.textSecondary)]}>{label}</Text>
      <ProgressView
        value={part.max ? part.earned / part.max : 0}
        modifiers={[progressViewStyle('linear'), tint(Colors.olive), frame({ width: 80 })]}
      />
    </VStack>
  );
}

type GeneralProps = Pick<KnowledgeListProps, 'knowledge' | 'onEditAcademics'>;

function General({ knowledge, onEditAcademics }: GeneralProps) {
  const { academics, education, location } = knowledge.static;
  const school = schoolName(education.highSchool) ?? schoolName(education.university);
  const score = (value: number | null) => (value == null ? '—' : String(value));

  return (
    <>
      <Section title="Academics">
        <Value label="GPA" value={academics.gpa == null ? '—' : academics.gpa.toFixed(2)} />
        <Value label="ACT" value={score(academics.actComposite)} />
        <Value label="SAT Reading & Writing" value={score(academics.satReading)} />
        <Value label="SAT Math" value={score(academics.satMath)} />
        <AddRow label="Edit Academics" systemImage="pencil.circle.fill" onPress={onEditAcademics} />
      </Section>

      <Section title="Education" footer={<Text>{KNOWLEDGE_COPY.educationFooter}</Text>}>
        <Value label="Stage" value={(education.educationStage && EDUCATION_STAGES[education.educationStage]) ?? '—'} />
        <Value label="School" value={school ?? '—'} />
        <Value label="Country" value={countryName(location.country) ?? '—'} />
        {location.country === 'US' ? <Value label="State" value={location.state ?? '—'} /> : null}
      </Section>

      <Section title="Study interests">
        {knowledge.studyInterests.length === 0 ? (
          <Text modifiers={[foregroundStyle(Colors.textMuted)]}>None yet</Text>
        ) : (
          knowledge.studyInterests.map((interest) => (
            <Text key={interest.cipCode} modifiers={[foregroundStyle(Colors.text)]}>
              {interest.name}
            </Text>
          ))
        )}
      </Section>
    </>
  );
}

type ItemsProps = Pick<KnowledgeListProps, 'knowledge' | 'onOpen' | 'onDelete'>;

function Activities({ knowledge, onOpen, onDelete }: ItemsProps) {
  const activityTitle = (id: string | null) => knowledge.experiences.find((experience) => experience.id === id)?.title;

  return (
    <>
      <Section title="Activities & projects" footer={<Text>Research, volunteering, extracurriculars, hobbies and projects.</Text>}>
        {knowledge.experiences.map((experience) => (
          <Item
            key={experience.id}
            kind="experiences"
            id={experience.id}
            title={experience.title}
            subtitle={[experience.organization, labelOf(EXPERIENCE_KINDS, experience.kind)].filter(Boolean).join(' · ')}
            detail={formatRange(experience.startDate, experience.endDate)}
            {...{ onOpen, onDelete }}
          />
        ))}
        <AddRow label="Add Activity" onPress={() => onOpen('experiences')} />
      </Section>

      <Section title="Work experience" footer={<Text>Jobs, internships and paid roles.</Text>}>
        {knowledge.professions.map((profession) => (
          <Item
            key={profession.id}
            kind="professions"
            id={profession.id}
            title={profession.name}
            subtitle={profession.company}
            detail={formatRange(profession.startDate, profession.endDate, profession.isCurrent)}
            {...{ onOpen, onDelete }}
          />
        ))}
        <AddRow label="Add Work Experience" onPress={() => onOpen('professions')} />
      </Section>

      <Section title="Achievements" footer={<Text>Honors and certifications.</Text>}>
        {knowledge.achievements.map((achievement) => (
          <Item
            key={achievement.id}
            kind="achievements"
            id={achievement.id}
            title={achievement.title}
            subtitle={[achievement.issuerOrEvent, activityTitle(achievement.experienceId)].filter(Boolean).join(' · ')}
            detail={formatMonth(achievement.achievementDate)}
            {...{ onOpen, onDelete }}
          />
        ))}
        <AddRow label="Add Achievement" onPress={() => onOpen('achievements')} />
      </Section>

      <Section title="References" footer={<Text>People who can vouch for you, like teachers and mentors.</Text>}>
        {knowledge.references.map((reference) => (
          <Item
            key={reference.id}
            kind="references"
            id={reference.id}
            title={reference.fullName}
            subtitle={[labelOf(CONNECTION_ROLES, reference.connectionRole), reference.organization].filter(Boolean).join(' · ')}
            detail={reference.agreedToWriteRecLetter ? 'Writing a letter' : null}
            {...{ onOpen, onDelete }}
          />
        ))}
        <AddRow label="Add Reference" onPress={() => onOpen('references')} />
      </Section>
    </>
  );
}

function Other({ knowledge, onOpen, onDelete }: ItemsProps) {
  return (
    <>
      <Section title="Notes" footer={<Text>Anything else the AI should know: goals, circumstances, what you care about.</Text>}>
        {knowledge.notes.map((note) => (
          <Item
            key={note.id}
            kind="notes"
            id={note.id}
            title={note.content}
            titleLines={3}
            subtitle={note.createdBy === 'agent' ? 'Added by Unive' : null}
            {...{ onOpen, onDelete }}
          />
        ))}
        <AddRow label="Add Note" onPress={() => onOpen('notes')} />
      </Section>

      <Section title="Languages">
        {knowledge.languages.map((language) => (
          <Item
            key={language.language}
            kind="languages"
            id={language.language}
            title={language.language}
            subtitle={language.certificationOrCourse}
            detail={labelOf(PROFICIENCIES, language.proficiency)}
            {...{ onOpen, onDelete }}
          />
        ))}
        <AddRow label="Add Language" onPress={() => onOpen('languages')} />
      </Section>
    </>
  );
}

function Value({ label, value }: { label: string; value: string }) {
  return (
    <LabeledContent label={label}>
      <Text modifiers={[foregroundStyle(value === '—' ? Colors.textMuted : Colors.textSecondary)]}>{value}</Text>
    </LabeledContent>
  );
}

// An item: tap it to edit, swipe it to delete.
function Item({
  kind,
  id,
  title,
  titleLines = 2,
  subtitle,
  detail,
  onOpen,
  onDelete,
}: {
  kind: KnowledgeKind;
  id: string;
  title: string;
  titleLines?: number;
  subtitle?: string | null;
  detail?: string | null;
} & Pick<KnowledgeListProps, 'onOpen' | 'onDelete'>) {
  return (
    <SwipeActions>
      <Button onPress={() => onOpen(kind, id)}>
        <HStack spacing={12} modifiers={[padding({ vertical: 4 })]}>
          <VStack alignment="leading" spacing={3}>
            <Text modifiers={[font({ textStyle: 'body' }), foregroundStyle(Colors.text), lineLimit(titleLines)]}>{title}</Text>
            {subtitle ? (
              <Text modifiers={[font({ textStyle: 'subheadline' }), foregroundStyle(Colors.textSecondary), lineLimit(1)]}>
                {subtitle}
              </Text>
            ) : null}
            {detail ? (
              <Text modifiers={[font({ textStyle: 'footnote' }), foregroundStyle(Colors.textMuted)]}>{detail}</Text>
            ) : null}
          </VStack>
          <Spacer />
          <Image systemName="chevron.right" modifiers={[font({ size: 13, weight: 'semibold' }), foregroundStyle(Colors.textMuted)]} />
        </HStack>
      </Button>
      <SwipeActions.Actions edge="trailing">
        <Button
          role="destructive"
          label="Delete"
          systemImage="trash"
          onPress={() => onDelete(kind, id)}
          // The list's olive tint would otherwise colour it too.
          modifiers={[tint(Colors.destructive)]}
        />
      </SwipeActions.Actions>
    </SwipeActions>
  );
}

function AddRow({ label, systemImage = 'plus.circle.fill', onPress }: { label: string; systemImage?: SFSymbol; onPress: () => void }) {
  return (
    <Button onPress={onPress}>
      <HStack spacing={10}>
        <Image systemName={systemImage} modifiers={[font({ size: 20 }), foregroundStyle(Colors.olive)]} />
        <Text modifiers={[foregroundStyle(Colors.olive)]}>{label}</Text>
      </HStack>
    </Button>
  );
}
