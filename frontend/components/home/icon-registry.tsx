"use client";

import * as LucideIcons from "lucide-react";
import type { ComponentType, SVGProps } from "react";

type LucideIcon = ComponentType<
  SVGProps<SVGSVGElement> & {
    size?: number | string;
    strokeWidth?: number | string;
    absoluteStrokeWidth?: boolean;
  }
>;

const icons = LucideIcons as unknown as Record<string, LucideIcon>;

export const FileTextIcon = icons.FileText;
export const FileIcon = icons.File;
export const LayersIcon = icons.Layers;
export const BrainIcon = icons.Brain;
export const CircleHelpIcon = icons.CircleHelp;
export const StickyNoteIcon = icons.StickyNote;
export const SparklesIcon = icons.Sparkles;
export const PlayCircleIcon = icons.PlayCircle;
export const UploadIcon = icons.Upload;
export const BotIcon = icons.Bot;
export const FolderOpenIcon = icons.FolderOpen;
export const HighlighterIcon = icons.Highlighter;
export const FolderPlusIcon = icons.FolderPlus;
export const ChevronLeftIcon = icons.ChevronLeft;

