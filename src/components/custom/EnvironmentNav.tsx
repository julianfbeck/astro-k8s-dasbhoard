import React from 'react';
import { BarChart, Link2, Terminal, FileText } from "lucide-react";
import { type SideBarUrl } from "@/lib/config";

type EnvironmentNavProps = {
  urls: SideBarUrl[];
  className?: string;
};

const iconMap = {
  chart: BarChart,
  url: Link2,
  terminal: Terminal,
  text: FileText,
} as const;

const EnvironmentNav = ({ urls, className = "" }: EnvironmentNavProps) => {
  return (
    <nav className={`space-y-1 ${className}`}>
      <h3 className="text-sm font-medium text-white/70 mb-2 px-2">
        Environments
      </h3>
      <div className="space-y-1">
        {urls.map((item) => {
          const Icon = iconMap[item.icon];
          return (
            <a
              key={item.name}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-2 py-1.5 text-sm text-white hover:bg-white/10 rounded-lg transition-colors"
              title={item.description}
            >
              <Icon size={16} />
              <span>{item.name}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
};

export default EnvironmentNav;