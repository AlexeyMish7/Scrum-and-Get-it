/**
 * NAV TABS COMPONENT
 * Reusable tabbed navigation with URL hash synchronization.
 *
 * FEATURES:
 * - URL hash sync (e.g., #overview, #materials)
 * - Automatic tab state management
 * - Responsive tab layout
 * - TypeScript support for tab values
 *
 * USAGE:
 * ```tsx
 * <NavTabs
 *   tabs={[
 *     { value: "overview", label: "Overview" },
 *     { value: "materials", label: "Materials" },
 *     { value: "notes", label: "Notes" },
 *   ]}
 *   renderContent={(activeTab) => {
 *     switch (activeTab) {
 *       case "overview": return <OverviewTab />;
 *       case "materials": return <MaterialsTab />;
 *       case "notes": return <NotesTab />;
 *     }
 *   }}
 * />
 * ```
 */

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Paper, Tabs, Tab } from "@mui/material";

export interface TabConfig<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactElement;
  disabled?: boolean;
}

interface NavTabsProps<T extends string = string> {
  tabs: TabConfig<T>[];
  defaultTab?: T;
  renderContent: (activeTab: T) => React.ReactNode;
  variant?: "standard" | "scrollable" | "fullWidth";
  centered?: boolean;
}

/**
 * NavTabs - Reusable tabbed navigation with URL hash sync
 */
export default function NavTabs<T extends string = string>({
  tabs,
  defaultTab,
  renderContent,
  variant = "standard",
  centered = false,
}: NavTabsProps<T>) {
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize active tab from URL hash or default
  const [activeTab, setActiveTab] = useState<T>(() => {
    const hash = location.hash.replace("#", "") as T;
    if (hash && tabs.some((t) => t.value === hash)) {
      return hash;
    }
    return defaultTab || tabs[0].value;
  });

  // Sync active tab with URL hash changes
  useEffect(() => {
    const hash = location.hash.replace("#", "") as T;
    if (hash && tabs.some((t) => t.value === hash)) {
      setActiveTab(hash);
    }
  }, [location.hash, tabs]);

  // Handle tab change - update URL hash
  const handleTabChange = (_event: React.SyntheticEvent, newValue: T) => {
    setActiveTab(newValue);
    navigate(`#${newValue}`, { replace: true });
  };

  return (
    <Box>
      {/* Tab Navigation */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant={variant}
          centered={centered}
          sx={{
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
              disabled={tab.disabled}
              sx={{ minHeight: 48 }}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box>{renderContent(activeTab)}</Box>
    </Box>
  );
}
