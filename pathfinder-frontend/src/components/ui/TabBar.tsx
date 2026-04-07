interface TabBarProps {
  tabs: { key: string; label: string }[];
  activeKey: string;
  onSelect: (key: string) => void;
}

export default function TabBar({ tabs, activeKey, onSelect }: TabBarProps) {
  return (
    <div className="flex border-b border-border-default bg-panel">
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            onClick={() => onSelect(tab.key)}
            className={`
              px-4 py-2.5 font-display text-[10px] tracking-widest uppercase
              border-b-2 transition-all duration-200 cursor-pointer
              ${
                isActive
                  ? "border-accent-cyan text-accent-cyan"
                  : "border-transparent text-text-secondary hover:text-text-primary hover:border-border-default"
              }
            `}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
