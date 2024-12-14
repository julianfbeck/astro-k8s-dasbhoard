import * as React from "react";
import {
  BarChart,
  FileText,
  FolderClosed,
  Link,
  Link2,
  Terminal,
  Text,
} from "lucide-react";
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
import type { AppConfig } from "@/lib/config";

interface DetailCommandBox {
  namespaces: NamespaceIngressInfo[];
  namespace: NamespaceInfo;
  appConfig: AppConfig;
}

const iconMap = {
  chart: BarChart,
  url: Link2,
  terminal: Terminal,
  text: FileText,
} as const;

export function DetailCommandBox({
  namespace,
  namespaces,
  appConfig,
}: DetailCommandBox) {
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

  const getWorkloadLogsUrl = (namespace: string, deploymentName: string) =>
    `${appConfig.GRAFANA_BASE_URL}/explore?schemaVersion=1&panes=%7B%22GCQ%22%3A%7B%22datasource%22%3A%22loki%22%2C%22queries%22%3A%5B%7B%22refId%22%3A%22A%22%2C%22expr%22%3A%22%7Bapp%3D%5C%22${deploymentName}%5C%22%2Cnamespace%3D%5C%22${namespace}%5C%22%7D%22%2C%22queryType%22%3A%22range%22%2C%22datasource%22%3A%7B%22type%22%3A%22loki%22%2C%22uid%22%3A%22loki%22%7D%7D%5D%2C%22range%22%3A%7B%22from%22%3A%22now-1h%22%2C%22to%22%3A%22now%22%7D%7D%7D&orgId=1`;

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
          if (e.key === 'Enter' || e.key === ' ') {
            handleShortcutClick();
          }
        }}
      >
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
          <CommandGroup heading="Logs">
            {namespace.deployments.map((deployment, index) => (
              <CommandItem
                key={`logs-${index}`}
                onSelect={() =>
                  window.open(
                    getWorkloadLogsUrl(
                      namespace.namespace.metadata?.name ?? "",
                      deployment.metadata?.name ?? "",
                    ),
                    "_blank",
                  )
                }
              >
                <Text className="mr-2 h-4 w-4" />
                <span className="flex-1 truncate">
                  {deployment.metadata?.name}
                </span>
                <span className="ml-2 text-xs text-muted-foreground">Logs</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Ingress URLs">
            {namespace.ingressUrls.map((url, index) => (
              <CommandItem
                key={`ingress-${index}`}
                onSelect={() => window.open(url.toString(), "_blank")}
              >
                <Link className="mr-2 h-4 w-4" />
                <span className="flex-1 truncate">{url.toString()}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  Ingress
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Namespaces">
            {namespaces.map((nsInfo) => (
              <CommandItem
                key={nsInfo.namespace.metadata?.name}
                onSelect={(value) => window.open(`/namespace/${value}`)}
              >
                <FolderClosed className="mr-2 h-4 w-4" />
                <span>{nsInfo.namespace.metadata?.name ?? "Error"}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
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
        </CommandList>
      </CommandDialog>
    </>
  );
}

export default DetailCommandBox;