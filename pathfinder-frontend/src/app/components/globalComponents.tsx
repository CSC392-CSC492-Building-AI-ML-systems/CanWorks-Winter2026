import React, { useState, ReactNode } from "react";
import Checkbox from "@mui/material/Checkbox";
import CheckIcon from "@mui/icons-material/Check";
import { createPortal } from "react-dom";
import { Loader2 } from 'lucide-react';

// Utility for classes
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

// --- Card Components ---
export const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("rounded-lg border bg-white text-slate-950 shadow-sm", className)} {...props} />
);

export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
);

export const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
);

export const CardDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-slate-500", className)} {...props} />
);

export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-6 pt-0", className)} {...props} />
);

// --- Button Component ---
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, loading = false, children, ...props }, ref) => {
    const variants = {
      default: "bg-slate-900 text-slate-50 hover:bg-slate-900/90",
      destructive: "bg-red-500 text-slate-50 hover:bg-red-500/90",
      outline: "border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900",
      secondary: "bg-slate-100 text-slate-900 hover:bg-slate-100/80",
      ghost: "hover:bg-slate-100 hover:text-slate-900",
      link: "text-slate-900 underline-offset-4 hover:underline",
    };
    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10",
    };
    const Comp = asChild ? 'span' : 'button';
    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        disabled={props.disabled || loading}
        ref={ref as any}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

// -- CheckBox Component --

export const CheckBox = ({ className, ...props }: React.ComponentProps<typeof Checkbox>) => {
  return (
    <Checkbox
      {...props}
        disableRipple
        icon={<span className="size-4 rounded-[4px] border bg-input-background" />}
        checkedIcon={
            <span className="size-4 rounded-[4px] border bg-primary text-primary-foreground flex items-center justify-center">
            <CheckIcon fontSize="inherit" />
            </span>
        }
        indeterminateIcon={
            <span className="size-4 rounded-[4px] border bg-primary text-primary-foreground flex items-center justify-center">
            —
            </span>
        }
        className={className}
    />
  );
}

// --- Badge Component ---
export const Badge = ({ className, variant = "default", ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "secondary" | "destructive" | "outline" }) => {
  const variants = {
    default: "border-transparent bg-slate-900 text-slate-50 hover:bg-slate-900/80",
    secondary: "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-100/80",
    destructive: "border-transparent bg-red-500 text-slate-50 hover:bg-red-500/80",
    outline: "text-slate-950",
  };
  return (
    <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2", variants[variant] || variants.default, className)} {...props} />
  );
};

// --- Input Component ---
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

// --- Label Component ---
export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
      {...props}
    />
  )
);
Label.displayName = "Label";

// --- Textarea Component ---
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

// --- Textarea Component ---

export interface SwitchProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    checked?: boolean;
    defaultChecked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
}

export const Switch = ({ checked, defaultChecked, onCheckedChange, className, disabled = false }: SwitchProps) => {
    const [internalChecked, setInternalChecked] = useState(defaultChecked || false);
    const isControlled = checked !== undefined;
    const currentChecked = isControlled ? checked : internalChecked;

    const handleClick = () => {
        if (disabled) return;
        const next = !currentChecked;
        if (!isControlled) setInternalChecked(next);
        onCheckedChange?.(next);
    };

    return (
        <button
        type="button"
        role="switch"
        aria-checked={currentChecked}
        onClick={handleClick}
        disabled={disabled}
        className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
            currentChecked ? "bg-primary" : "bg-gray-300",
            className
        )}
        >
        <span
            className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
            currentChecked ? "translate-x-5" : "translate-x-1"
            )}
        />
        </button>
    );
}
Switch.displayName = "Switch";

// --- Tabs Components ---
// Context for Active State
const TabsContext = React.createContext<{ activeTab: string; setActiveTab: (v: string) => void }>({ activeTab: '', setActiveTab: () => {} });

export const Tabs = ({ defaultValue, children, className, ...props }: any) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className} {...props}>{children}</div>
    </TabsContext.Provider>
  );
};

// Cleaner "Line/Underline" Style List
export const TabsList = ({ className, children, ...props }: any) => (
  <div 
    className={cn(
      "flex w-full items-center justify-start border-b border-slate-200 bg-transparent p-0", 
      className
    )} 
    {...props}
  >
    {children}
  </div>
);

// Cleaner "Line/Underline" Style Trigger
export const TabsTrigger = ({ value, className, children, ...props }: any) => {
  const { activeTab, setActiveTab } = React.useContext(TabsContext);
  const isActive = activeTab === value;
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap px-6 py-2.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border-b-2",
        isActive 
          ? "border-slate-900 text-slate-900" 
          : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300",
        className
      )}
      onClick={() => setActiveTab(value)}
      {...props}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ value, className, children, ...props }: any) => {
  const { activeTab } = React.useContext(TabsContext);
  if (activeTab !== value) return null;
  return (
    <div className={cn("mt-6 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2", className)} {...props}>
      {children}
    </div>
  );
};

// --- Alert Components ---
export const Alert = ({ className, variant = "default", ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "destructive" }) => {
    return (
        <div
            role="alert"
            className={cn(
                "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-slate-950 [&>svg~*]:pl-7",
                className
            )}
            {...props}
        />
    );
};

export const AlertDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <div className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
);

// --- AlertDialog Context ---
interface AlertDialogContextType {
    open: boolean;
    setOpen: (open: boolean) => void;
}

const AlertDialogContext = React.createContext<AlertDialogContextType>({
    open: false,
    setOpen: () => {},
});

// --- Root Component ---
interface AlertDialogProps {
    children: ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export const AlertDialog = ({ children, open: controlledOpen, onOpenChange }: AlertDialogProps) => {
    const [open, setOpen] = useState(false);
    const value = {
        open: controlledOpen ?? open,
        setOpen: (o: boolean) => {
        if (onOpenChange) onOpenChange(o);
        else setOpen(o);
        },
    };

    return <AlertDialogContext.Provider value={value}>{children}</AlertDialogContext.Provider>;
}

// --- Trigger ---
interface AlertDialogTriggerProps {
    children: ReactNode;
}

export const AlertDialogTrigger = ({ children }: AlertDialogTriggerProps) => {
    const { setOpen } = React.useContext(AlertDialogContext);
    return <div onClick={() => setOpen(true)}>{children}</div>;
}

// --- Portal + Overlay + Content ---
interface AlertDialogOverlayProps {
    className?: string;
}

const AlertDialogOverlay = ({ className }: AlertDialogOverlayProps) => {
    const { setOpen } = React.useContext(AlertDialogContext);

    return createPortal(
        <div
        onClick={() => setOpen(false)}
        className={cn(
            "fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out",
            className
        )}
        />,
        document.body
    );
}

interface AlertDialogContentProps {
    children: ReactNode;
    className?: string;
}

export const AlertDialogContent = ({ children, className }: AlertDialogContentProps) => {
    const { open } = React.useContext(AlertDialogContext);

    if (!open) return null;

    return createPortal(
        <>
        <AlertDialogOverlay />
        <div
            className={cn(
            "fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg",
            className
            )}
        >
            {children}
        </div>
        </>,
        document.body
    );
}

// --- Header, Footer, Title, Description ---
export const AlertDialogHeader = ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={cn("flex flex-col gap-2 text-center sm:text-left", className)}>{children}</div>
);

export const AlertDialogFooter = ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}>{children}</div>
);

export const AlertDialogTitle = ({ children, className }: { children: ReactNode; className?: string }) => (
    <h2 className={cn("text-lg font-semibold", className)}>{children}</h2>
);

export const AlertDialogDescription = ({ children, className }: { children: ReactNode; className?: string }) => (
    <p className={cn("text-sm text-gray-600", className)}>{children}</p>
);

// --- Actions ---
interface AlertDialogActionProps {
    children: ReactNode;
    onClick?: () => void;
    className?: string;
}

export const AlertDialogAction = ({ children, onClick, className }: AlertDialogActionProps) => {
    const { setOpen } = React.useContext(AlertDialogContext);
    return (
        <Button
        onClick={() => {
            onClick?.();
            setOpen(false);
        }}
        className={cn(className)}
        >
        {children}
        </Button>
    );
}

export const AlertDialogCancel = ({ children, className }: { children: ReactNode; className?: string }) => {
    const { setOpen } = React.useContext(AlertDialogContext);
    return (
        <Button
        variant="outline"
        onClick={() => setOpen(false)}
        className={cn(className)}
        >
        {children}
        </Button>
    );
}
