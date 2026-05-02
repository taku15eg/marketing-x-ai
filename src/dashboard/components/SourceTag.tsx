'use client';

import type { SourceTag as SourceTagType } from '../lib/types';
import { SOURCE_TAG_CONFIG, getSourceTagLabel } from '../lib/types';

interface Props {
  tag: SourceTagType;
}

export default function SourceTag({ tag }: Props) {
  const config = SOURCE_TAG_CONFIG[tag.type];
  const label = getSourceTagLabel(tag);

  return (
    <span
      className="inline-flex items-center gap-1 ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium"
      style={{ backgroundColor: config.bgColor, color: config.color }}
    >
      {label}
    </span>
  );
}
