"use client";

import * as React from "react";
import { FolderClosed, Link } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import type { NamespaceInfo, NamespaceIngressInfo } from "@/lib/k8s/client";

interface DetailCommandBox {
  namespaces: NamespaceIngressInfo[];
  namespace: NamespaceInfo;
}

export function DetailCommandBox({ namespace, namespaces }: DetailCommandBox) {
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

  return (
    <>
      <div className="flex items-center space-x-2 mr-3">
        <span className="text-sm text-muted-foreground">Press</span>
        <kbd className="inline-flex h-8 w-8 select-none items-center justify-center rounded border bg-muted px-2 font-mono text-sm font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>
          <span>J</span>
        </kbd>
      </div>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Ingress URLs">
            {namespace.ingressUrls.map((url, index) => (
              <CommandItem
                key={`ingress-${index}`}
                onSelect={() => window.open(url.toString(), "_blank")}
              >
                <Link className="mr-2 h-4 w-4" />
                <span className="flex-1 truncate">{url.toString()}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Namespaces">
            {namespaces.map((nsInfo) => (
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
        </CommandList>
      </CommandDialog>
    </>
  );
}
