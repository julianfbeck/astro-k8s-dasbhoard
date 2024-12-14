"use client";
import * as React from "react";
import {
  BarChart,
  FileText,
  FolderClosed,
  Link,
  Link2,
  Terminal,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import type { NamespaceIngressInfo } from "@/lib/k8s/client";
import type { AppConfig } from "@/lib/config";

interface CommandBoxProps {
  namespaceData: NamespaceIngressInfo[];
  appConfig: AppConfig;
}

const iconMap = {
  chart: BarChart,
  url: Link2,
  terminal: Terminal,
  text: FileText,
} as const;

export function ListCommandBox({ namespaceData, appConfig }: CommandBoxProps) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleShortcutClick = () => {
    setOpen((open) => !open);
  };

  return (
    <>
      <div
        className="flex items-center space-x-2 mr-3 cursor-pointer"
        onClick={handleShortcutClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleShortcutClick();
          }
        }}
      >
        <span className="text-sm text-muted-foreground">To Search Press</span>
        <kbd className="inline-flex h-8 w-8 select-none items-center justify-center rounded border bg-muted px-2 font-mono text-sm font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>
          <span>J</span>
        </kbd>
      </div>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="External Links">
            {appConfig.SIDEBAR_URLS.map((item) => {
              const Icon = iconMap[item.icon];
              return (
                <CommandItem
                  key={item.name}
                  onSelect={() => window.open(item.url, "_blank")}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span className="flex-1 truncate">{item.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {item.description}
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>
          <CommandGroup heading="Namespaces">
            {namespaceData.map((nsInfo) => (
              <CommandItem
                key={nsInfo.namespace.metadata?.name}
                onSelect={(value) =>
                  window.open(`/namespace/${value}`, "_blank")
                }
              >
                <FolderClosed className="mr-2 h-4 w-4" />
                <span>{nsInfo.namespace.metadata?.name ?? "Error"}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Ingress URLs">
            {namespaceData.map((nsInfo) =>
              nsInfo.ingressUrls.map((url, index) => (
                <CommandItem
                  key={`ingress-${nsInfo.namespace.metadata?.name}-${index}`}
                  onSelect={() => window.open(url.toString(), "_blank")}
                >
                  <Link className="mr-2 h-4 w-4" />
                  <span className="flex-1 truncate">{url.toString()}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {nsInfo.namespace.metadata?.name}
                  </span>
                </CommandItem>
              )),
            )}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
