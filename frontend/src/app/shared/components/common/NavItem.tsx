import { ListItemButton, ListItemText } from "@mui/material";

export default function NavItem({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <ListItemButton component="a" href={href}>
      <ListItemText primary={label} />
    </ListItemButton>
  );
}
