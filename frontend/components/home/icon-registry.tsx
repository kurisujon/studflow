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

export const ArrowRightIcon = icons.ArrowRight;
export const BookOpenIcon = icons.BookOpen;
export const RotateCcwIcon = icons.RotateCcw;
export const TargetIcon = icons.Target;
export const CheckCircle2Icon = icons.CheckCircle2;
export const TrophyIcon = icons.Trophy;
export const FlameIcon = icons.Flame;
export const Loader2Icon = icons.Loader2;
export const XIcon = icons.X;
export const AlertCircleIcon = icons.AlertCircle;
export const MenuIcon = icons.Menu;
export const SearchIcon = icons.Search;
export const HomeIcon = icons.Home;
export const LibraryIcon = icons.Library;
export const MessagesSquareIcon = icons.MessagesSquare;
export const CalendarCheckIcon = icons.CalendarCheck;
export const ChartNoAxesColumnIncreasingIcon = icons.ChartNoAxesColumnIncreasing;
export const SettingsIcon = icons.Settings;
export const PanelLeftCloseIcon = icons.PanelLeftClose;
export const PanelLeftOpenIcon = icons.PanelLeftOpen;
export const ChevronRightIcon = icons.ChevronRight;
export const Clock3Icon = icons.Clock3;
export const SlidersHorizontalIcon = icons.SlidersHorizontal;
export const ArrowUpDownIcon = icons.ArrowUpDown;
export const Grid2X2Icon = icons.Grid2X2;
export const ListIcon = icons.List;
export const BookMarkedIcon = icons.BookMarked;
export const MessageCircleIcon = icons.MessageCircle;
export const GaugeIcon = icons.Gauge;
export const PlusIcon = icons.Plus;
