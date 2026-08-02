declare module "lucide-react" {
  type IconProps = import("react").SVGProps<SVGSVGElement> & {
    size?: number | string;
    strokeWidth?: number | string;
    absoluteStrokeWidth?: boolean;
  };

  export const Bot: import("react").ComponentType<IconProps>;
  export const Check: import("react").ComponentType<IconProps>;
  export const CheckCircle2: import("react").ComponentType<IconProps>;
  export const ChevronDown: import("react").ComponentType<IconProps>;
  export const ChevronUp: import("react").ComponentType<IconProps>;
  export const Clipboard: import("react").ComponentType<IconProps>;
  export const Eraser: import("react").ComponentType<IconProps>;
  export const ExternalLink: import("react").ComponentType<IconProps>;
  export const FileText: import("react").ComponentType<IconProps>;
  export const GripHorizontal: import("react").ComponentType<IconProps>;
  export const Highlighter: import("react").ComponentType<IconProps>;
  export const Layers3: import("react").ComponentType<IconProps>;
  export const Maximize2: import("react").ComponentType<IconProps>;
  export const MessageSquarePlus: import("react").ComponentType<IconProps>;
  export const MessageSquareText: import("react").ComponentType<IconProps>;
  export const Minus: import("react").ComponentType<IconProps>;
  export const Redo2: import("react").ComponentType<IconProps>;
  export const RefreshCw: import("react").ComponentType<IconProps>;
  export const RotateCcw: import("react").ComponentType<IconProps>;
  export const Send: import("react").ComponentType<IconProps>;
  export const Square: import("react").ComponentType<IconProps>;
  export const StickyNote: import("react").ComponentType<IconProps>;
  export const Underline: import("react").ComponentType<IconProps>;
  export const Undo2: import("react").ComponentType<IconProps>;
  export const User: import("react").ComponentType<IconProps>;
  export const X: import("react").ComponentType<IconProps>;
}

declare module "@base-ui/react/button" {
  export namespace Button {
    type Props = import("react").ButtonHTMLAttributes<HTMLButtonElement> & {
      nativeButton?: boolean;
      render?: import("react").ReactElement;
    };
  }

  export const Button: import("react").ForwardRefExoticComponent<
    Button.Props & import("react").RefAttributes<HTMLButtonElement>
  >;
}
