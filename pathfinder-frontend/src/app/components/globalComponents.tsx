import React from 'react';
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


// --- Alert Dialog (Modal) Components ---
const AlertDialogContext = React.createContext<any>(null);

export const AlertDialog = ({ children }: any) => {
  const [isOpen, setIsOpen] = React.useState(false);
  return <AlertDialogContext.Provider value={{ isOpen, setIsOpen }}>{children}</AlertDialogContext.Provider>;
};

export const AlertDialogTrigger = ({ children, asChild }: any) => {
  const { setIsOpen } = React.useContext(AlertDialogContext);
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, { onClick: () => setIsOpen(true) });
  }
  return <div onClick={() => setIsOpen(true)}>{children}</div>;
};

export const AlertDialogContent = ({ children }: any) => {
  const { isOpen } = React.useContext(AlertDialogContext);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-lg animate-in zoom-in-95 duration-200">
        {children}
      </div>
    </div>
  );
};

export const AlertDialogHeader = ({ children }: any) => <div className="space-y-2 mb-4">{children}</div>;
export const AlertDialogTitle = ({ children }: any) => <h2 className="text-xl font-bold tracking-tight">{children}</h2>;
export const AlertDialogDescription = ({ children }: any) => <p className="text-sm text-slate-500 leading-relaxed">{children}</p>;
export const AlertDialogFooter = ({ children }: any) => <div className="flex justify-end gap-2 mt-6">{children}</div>;

export const AlertDialogCancel = ({ children }: any) => {
  const { setIsOpen } = React.useContext(AlertDialogContext);
  return <Button variant="outline" onClick={() => setIsOpen(false)}>{children}</Button>;
};

export const AlertDialogAction = ({ children, onClick, className }: any) => {
  const { setIsOpen } = React.useContext(AlertDialogContext);
  return (
    <Button 
      className={className} 
      onClick={(e) => { if (onClick) onClick(e); setIsOpen(false); }}
    >
      {children}
    </Button>
  );
};