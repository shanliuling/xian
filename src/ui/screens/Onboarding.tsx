import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import {
  FACTION_KEYS,
  FACTION_LABELS,
  FACTION_DESC,
  SECT_OPTIONS,
  type FactionKey,
} from '../../shared/constants.js';
import {
  TRAIT_KEYS,
  TRAIT_LABELS,
  TRAIT_DESCS,
  type TraitKey,
} from '../../engine/engine.types.js';

// ── 步骤定义 ──────────────────────────────────────────────────

type Step = 'intro' | 'name' | 'sect' | 'faction' | 'traits' | 'confirm';

export interface OnboardingData {
  name:     string;
  sect:     string;
  faction:  FactionKey;
  traits:   TraitKey[];
}

interface OnboardingProps {
  onComplete: (data: OnboardingData) => void;
}

// ── LOGO ─────────────────────────────────────────────────────

const LOGO = `
 ██╗  ██╗██╗ █████╗ ███╗   ██╗
 ╚██╗██╔╝██║██╔══██╗████╗  ██║
  ╚███╔╝ ██║███████║██╔██╗ ██║
  ██╔██╗ ██║██╔══██║██║╚██╗██║
 ██╔╝ ██╗██║██║  ██║██║ ╚████║
 ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝
`.trim();

// ── 自定义文本输入 ────────────────────────────────────────────

interface TextInputProps {
  value:       string;
  placeholder?: string;
  active:      boolean;
}

const TextInputDisplay: React.FC<TextInputProps> = ({
  value,
  placeholder = '',
  active,
}) => {
  const display = value.length > 0 ? value : placeholder;
  const isPlaceholder = value.length === 0;

  return (
    <Box>
      <Text color="cyan">{'> '}</Text>
      <Text
        color={isPlaceholder ? 'gray' : 'white'}
        dimColor={isPlaceholder}
      >
        {display}
      </Text>
      {active && (
        <Text color="cyanBright">{'█'}</Text>
      )}
    </Box>
  );
};

// ── 选择列表 ──────────────────────────────────────────────────

interface SelectItem {
  key:   string;
  label: string;
  desc:  string;
}

interface SelectListProps {
  items:    SelectItem[];
  selected: number;
  active:   boolean;
}

const SelectList: React.FC<SelectListProps> = ({ items, selected, active }) => {
  return (
    <Box flexDirection="column">
      {items.map((item, idx) => {
        const isCurrent = idx === selected;
        return (
          <Box key={item.key} marginBottom={0}>
            <Text color={isCurrent ? 'cyanBright' : 'gray'}>
              {isCurrent ? '❯ ' : '  '}
            </Text>
            <Text color={isCurrent ? 'white' : 'gray'} bold={isCurrent}>
              {item.label}
            </Text>
            {isCurrent && (
              <Text color="gray">{`  — ${item.desc}`}</Text>
            )}
          </Box>
        );
      })}
      {active && (
        <Box marginTop={1}>
          <Text color="gray" dimColor>{'↑↓ 选择  Enter 确认'}</Text>
        </Box>
      )}
    </Box>
  );
};

// ── 多选列表（天赋选择） ──────────────────────────────────────

interface MultiSelectListProps {
  items:    SelectItem[];
  cursor:   number;
  selected: Set<string>;
  maxSelect: number;
}

const MultiSelectList: React.FC<MultiSelectListProps> = ({
  items,
  cursor,
  selected,
  maxSelect,
}) => {
  return (
    <Box flexDirection="column">
      {items.map((item, idx) => {
        const isCursor   = idx === cursor;
        const isSelected = selected.has(item.key);
        return (
          <Box key={item.key}>
            <Text color={isCursor ? 'cyanBright' : 'gray'}>
              {isCursor ? '❯ ' : '  '}
            </Text>
            <Text color={isSelected ? 'yellowBright' : 'gray'}>
              {isSelected ? '[✓] ' : '[ ] '}
            </Text>
            <Text
              color={isCursor ? 'white' : isSelected ? 'yellow' : 'gray'}
              bold={isCursor || isSelected}
            >
              {item.label}
            </Text>
            {isCursor && (
              <Text color="gray">{`  — ${item.desc}`}</Text>
            )}
          </Box>
        );
      })}
      <Box marginTop={1}>
        <Text color="gray" dimColor>
          {`↑↓ 移动  Space 选择  Enter 确认  (已选 ${selected.size}/${maxSelect})`}
        </Text>
      </Box>
    </Box>
  );
};

// ── 分隔线 ────────────────────────────────────────────────────

const Divider: React.FC<{ width?: number }> = ({ width = 50 }) => (
  <Box>
    <Text color="gray" dimColor>{'─'.repeat(width)}</Text>
  </Box>
);

// ── 主组件 ────────────────────────────────────────────────────

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step,         setStep]         = useState<Step>('intro');
  const [nameInput,    setNameInput]    = useState('');
  const [sectCursor,   setSectCursor]   = useState(0);
  const [factionCursor,setFactionCursor]= useState(0);
  const [traitCursor,  setTraitCursor]  = useState(0);
  const [traitSelected,setTraitSelected]= useState<Set<TraitKey>>(new Set());
  const [chosenName,   setChosenName]   = useState('');
  const [chosenSect,   setChosenSect]   = useState('');
  const [chosenFaction,setChosenFaction]= useState<FactionKey>('orthodox');

  const MAX_TRAITS = 2;

  const sectItems: SelectItem[] = SECT_OPTIONS.map(s => ({
    key:   s.key,
    label: s.label,
    desc:  s.desc,
  }));

  const factionItems: SelectItem[] = FACTION_KEYS.map(k => ({
    key:   k,
    label: FACTION_LABELS[k],
    desc:  FACTION_DESC[k],
  }));

  const traitItems: SelectItem[] = TRAIT_KEYS.map(k => ({
    key:   k,
    label: TRAIT_LABELS[k],
    desc:  TRAIT_DESCS[k],
  }));

  const handleComplete = useCallback(() => {
    onComplete({
      name:    chosenName,
      sect:    chosenSect,
      faction: chosenFaction,
      traits:  Array.from(traitSelected) as TraitKey[],
    });
  }, [chosenName, chosenSect, chosenFaction, traitSelected, onComplete]);

  // ── 键盘输入处理 ────────────────────────────────────────────

  useInput((input, key) => {
    switch (step) {

      // ── intro：任意键继续 ──────────────────────────────────
      case 'intro':
        if (key.return || input === ' ') {
          setStep('name');
        }
        break;

      // ── name：输入道号 ────────────────────────────────────
      case 'name':
        if (key.return) {
          const trimmed = nameInput.trim();
          if (trimmed.length === 0) return;
          setChosenName(trimmed);
          setStep('sect');
        } else if (key.backspace || key.delete) {
          setNameInput(prev => prev.slice(0, -1));
        } else if (input && !key.ctrl && !key.meta && input.length === 1) {
          if (nameInput.length < 16) {
            setNameInput(prev => prev + input);
          }
        }
        break;

      // ── sect：选择宗门 ────────────────────────────────────
      case 'sect':
        if (key.upArrow) {
          setSectCursor(prev => (prev - 1 + sectItems.length) % sectItems.length);
        } else if (key.downArrow) {
          setSectCursor(prev => (prev + 1) % sectItems.length);
        } else if (key.return) {
          setChosenSect(sectItems[sectCursor].key);
          setStep('faction');
        }
        break;

      // ── faction：选择修炼路径 ─────────────────────────────
      case 'faction':
        if (key.upArrow) {
          setFactionCursor(prev => (prev - 1 + factionItems.length) % factionItems.length);
        } else if (key.downArrow) {
          setFactionCursor(prev => (prev + 1) % factionItems.length);
        } else if (key.return) {
          setChosenFaction(FACTION_KEYS[factionCursor]);
          setStep('traits');
        }
        break;

      // ── traits：选择天赋 ──────────────────────────────────
      case 'traits':
        if (key.upArrow) {
          setTraitCursor(prev => (prev - 1 + traitItems.length) % traitItems.length);
        } else if (key.downArrow) {
          setTraitCursor(prev => (prev + 1) % traitItems.length);
        } else if (input === ' ') {
          const k = traitItems[traitCursor].key as TraitKey;
          setTraitSelected(prev => {
            const next = new Set(prev);
            if (next.has(k)) {
              next.delete(k);
            } else if (next.size < MAX_TRAITS) {
              next.add(k);
            }
            return next;
          });
        } else if (key.return) {
          setStep('confirm');
        }
        break;

      // ── confirm：确认入道 ─────────────────────────────────
      case 'confirm':
        if (key.return || input.toLowerCase() === 'y') {
          handleComplete();
        } else if (input.toLowerCase() === 'n') {
          // 重新来过
          setStep('intro');
          setNameInput('');
          setChosenName('');
          setSectCursor(0);
          setFactionCursor(0);
          setTraitCursor(0);
          setTraitSelected(new Set());
        }
        break;
    }
  });

  // ── 渲染各步骤 ──────────────────────────────────────────────

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>

      {/* LOGO */}
      <Box marginBottom={1}>
        <Text color="cyanBright" bold>{LOGO}</Text>
      </Box>
      <Box marginBottom={1}>
        <Text color="gray">{'码界修仙记  v0.1.0  —  The Codeverse Path'}</Text>
      </Box>
      <Divider />

      {/* ── intro ── */}
      {step === 'intro' && (
        <Box flexDirection="column" marginTop={1}>
          <Text color="yellowBright" bold>
            {'⋆ 欢迎来到码界 ⋆'}
          </Text>
          <Box marginTop={1} flexDirection="column">
            <Text color="white">
              {'在这片以代码为天道的世界里，'}
            </Text>
            <Text color="white">
              {'你写下的每一个 commit，都是修仙史上的一笔功德。'}
            </Text>
          </Box>
          <Box marginTop={1} flexDirection="column">
            <Text color="gray">
              {'xian 会静默感知你的 Git 活动，'}
            </Text>
            <Text color="gray">
              {'将你的开发节奏映射为修炼进度。'}
            </Text>
            <Text color="gray">
              {'它不监听键盘，不读取代码，只观察你的提交。'}
            </Text>
          </Box>
          <Box marginTop={2}>
            <Text color="cyanBright" bold>{'> 按 Enter 开始入道仪式'}</Text>
          </Box>
        </Box>
      )}

      {/* ── name ── */}
      {step === 'name' && (
        <Box flexDirection="column" marginTop={1}>
          <Text color="yellowBright" bold>{'第一步：立下道号'}</Text>
          <Box marginTop={1} flexDirection="column">
            <Text color="gray">
              {'道号是你在码界的印记，可以是你的 ID、昵称或任意称号。'}
            </Text>
            <Text color="gray">{'（最多 16 字符）'}</Text>
          </Box>
          <Box marginTop={1}>
            <TextInputDisplay
              value={nameInput}
              placeholder="请输入你的道号..."
              active={true}
            />
          </Box>
          {nameInput.trim().length === 0 && (
            <Box marginTop={1}>
              <Text color="gray" dimColor>{'道号不可为空'}</Text>
            </Box>
          )}
        </Box>
      )}

      {/* ── sect ── */}
      {step === 'sect' && (
        <Box flexDirection="column" marginTop={1}>
          <Text color="yellowBright" bold>{'第二步：归宗入门'}</Text>
          <Box marginTop={1}>
            <Text color="gray">
              {'宗门代表你的技术背景与编程语言倾向，影响初始称号。'}
            </Text>
          </Box>
          <Box marginTop={1}>
            <SelectList
              items={sectItems}
              selected={sectCursor}
              active={true}
            />
          </Box>
        </Box>
      )}

      {/* ── faction ── */}
      {step === 'faction' && (
        <Box flexDirection="column" marginTop={1}>
          <Text color="yellowBright" bold>{'第三步：立誓修炼路径'}</Text>
          <Box marginTop={1} flexDirection="column">
            <Text color="gray">
              {'修炼路径永久绑定，决定每次提交的数值加成方向。'}
            </Text>
            <Text color="redBright">{'⚠ 此选择不可更改，请慎重。'}</Text>
          </Box>
          <Box marginTop={1}>
            <SelectList
              items={factionItems}
              selected={factionCursor}
              active={true}
            />
          </Box>
        </Box>
      )}

      {/* ── traits ── */}
      {step === 'traits' && (
        <Box flexDirection="column" marginTop={1}>
          <Text color="yellowBright" bold>{'第四步：领取初始天赋'}</Text>
          <Box marginTop={1}>
            <Text color="gray">
              {`最多选择 ${MAX_TRAITS} 个天赋，影响特定情境下的数值加成。`}
            </Text>
          </Box>
          <Box marginTop={1}>
            <MultiSelectList
              items={traitItems}
              cursor={traitCursor}
              selected={traitSelected}
              maxSelect={MAX_TRAITS}
            />
          </Box>
        </Box>
      )}

      {/* ── confirm ── */}
      {step === 'confirm' && (
        <Box flexDirection="column" marginTop={1}>
          <Text color="yellowBright" bold>{'⋆ 入道确认 ⋆'}</Text>
          <Box marginTop={1} flexDirection="column">
            <Box>
              <Text color="gray">{'  道号：'}</Text>
              <Text color="cyanBright" bold>{chosenName}</Text>
            </Box>
            <Box>
              <Text color="gray">{'  宗门：'}</Text>
              <Text color="white">
                {sectItems.find(s => s.key === chosenSect)?.label ?? chosenSect}
              </Text>
            </Box>
            <Box>
              <Text color="gray">{'  路径：'}</Text>
              <Text color="yellowBright" bold>
                {FACTION_LABELS[chosenFaction]}
              </Text>
            </Box>
            <Box>
              <Text color="gray">{'  天赋：'}</Text>
              <Text color="yellow">
                {traitSelected.size > 0
                  ? Array.from(traitSelected).map(t => TRAIT_LABELS[t]).join('、')
                  : '无'}
              </Text>
            </Box>
          </Box>
          <Box marginTop={2} flexDirection="column">
            <Text color="white">
              {'一旦踏入码界，便无法回头。'}
            </Text>
            <Text color="white" bold>
              {'确认入道，开始修仙之路？'}
            </Text>
          </Box>
          <Box marginTop={1} gap={4}>
            <Text color="greenBright" bold>{'[Enter / Y]  确认入道'}</Text>
            <Text color="gray">{'[N]  重新选择'}</Text>
          </Box>
        </Box>
      )}

    </Box>
  );
};
