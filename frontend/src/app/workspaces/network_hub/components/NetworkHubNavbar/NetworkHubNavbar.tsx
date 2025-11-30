import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  type SelectChangeEvent,
} from "@mui/material";
import { Group } from "@mui/icons-material";

interface Props {
  title?: string;
  selectedTab: number;
  onTabChange: (newTab: number) => void;
  timeRange: string;
  onTimeRangeChange: (value: string) => void;
}

export default function NetworkHubNavbar({
  title = "Network Hub",
  selectedTab,
  onTabChange,
  timeRange,
  onTimeRangeChange,
}: Props) {
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Typography variant="h4">{title}</Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e: SelectChangeEvent<string>) =>
                onTimeRangeChange(e.target.value as string)
              }
              label="Time Range"
            >
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
              <MenuItem value="1y">Last year</MenuItem>
              <MenuItem value="all">All time</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Tabs
        value={selectedTab}
        onChange={(_e, v) => onTabChange(v)}
        sx={{ mb: 2 }}
      >
        <Tab label="Contacts" />
        <Tab label="Events" />
        <Tab label="Interviews" />
        <Tab
          label="Peer Groups"
          icon={<Group sx={{ fontSize: 18 }} />}
          iconPosition="start"
        />
      </Tabs>
    </Box>
  );
}
